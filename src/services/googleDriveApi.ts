declare global {
  interface Window {
    google: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any = null;
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

export const initGoogleIdentityServices = (clientId: string) => {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      initializeClient(clientId);
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeClient(clientId);
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

const initializeClient = (clientId: string) => {
  // @ts-ignore
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (tokenResponse: any) => {
      if (tokenResponse.error !== undefined) {
        throw tokenResponse;
      }
      accessToken = tokenResponse.access_token;
      // Token usually expires in 3600 seconds
      tokenExpiresAt = Date.now() + (tokenResponse.expires_in * 1000) - 60000; // 1 min buffer
    },
  });
};

export const requestAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (accessToken && Date.now() < tokenExpiresAt) {
      resolve(accessToken);
      return;
    }

    if (!tokenClient) {
      reject(new Error('Google Identity Services not initialized'));
      return;
    }

    // Override the callback to resolve the promise
    const originalCallback = tokenClient.callback;
    tokenClient.callback = async (tokenResponse: any) => {
      try {
        originalCallback(tokenResponse);
        resolve(tokenResponse.access_token);
      } catch (e) {
        reject(e);
      }
    };
    
    // Trigger the popup
    tokenClient.requestAccessToken();
  });
};

export const getOrCreateFlowForgeFolder = async (token: string): Promise<string> => {
  const folderName = 'FlowForge';
  
  // 1. Search for existing folder
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!searchRes.ok) throw new Error('Failed to search Drive');
  const searchData = await searchRes.json();
  
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // 2. Create if not exists
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  
  if (!createRes.ok) throw new Error('Failed to create Drive folder');
  const createData = await createRes.json();
  return createData.id;
};

export const uploadFileToDrive = async (blob: Blob, fileName: string, folderId: string, token: string): Promise<string> => {
  const metadata = {
    name: fileName,
    parents: [folderId]
  };
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);
  
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });
  
  if (!res.ok) throw new Error('Failed to upload file to Drive');
  const data = await res.json();
  return data.id;
};
