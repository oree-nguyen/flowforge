import { useState, useEffect } from 'react';
import { useWorkflowStore, type ToolbarVisibility } from '../store/workflowStore';
import { fetchModels } from '../services/openRouterApi';
import { X, CheckCircle2, AlertCircle, Database, Cloud, Layout, Key, SlidersHorizontal } from 'lucide-react';
import { getStorageEstimate, requestPersistentStorage } from '../services/mediaStorage';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { 
    apiKey,
    apiKeys,
    setApiKey,
    addApiKey,
    removeApiKey,
    setActiveApiKey,
    autoOpenProperties, 
    setAutoOpenProperties,
    toolbarVisibility,
    setToolbarVisibility
  } = useWorkflowStore();

  const [tempKeyName, setTempKeyName] = useState('OpenRouter Key');
  const [tempKey, setTempKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Google Drive & Storage
  const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('flowforge_gdrive_client_id') || '');
  const [driveStatus, setDriveStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    localStorage.getItem('flowforge_gdrive_folder') ? 'connected' : 'idle'
  );
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');

  useEffect(() => {
    if (isOpen) {
      getStorageEstimate().then(est => {
        if (est) {
          const mb = (est.usage / (1024 * 1024)).toFixed(2);
          setStorageUsage(`${mb} MB used`);
        } else {
          setStorageUsage('Unavailable');
        }
      });
      requestPersistentStorage();
      
      // Auto-migrate legacy apiKey
      if (apiKey && (!apiKeys || apiKeys.length === 0)) {
        addApiKey('Legacy Key', apiKey);
      }
    }
  }, [isOpen]);

  const checkAndAddKey = async () => {
    if (!tempKey) return;
    setStatus('checking');
    try {
      await fetchModels(tempKey);
      setStatus('success');
      addApiKey(tempKeyName || 'Unnamed Key', tempKey);
      setTempKey('');
      setTempKeyName('OpenRouter Key');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Invalid API Key');
    }
  };

  const handleConnectDrive = async () => {
    if (!googleClientId) return;
    setDriveStatus('connecting');
    setErrorMsg('');
    try {
      localStorage.setItem('flowforge_gdrive_client_id', googleClientId);
      const { initGoogleIdentityServices, requestAccessToken, getOrCreateFlowForgeFolder } = await import('../services/googleDriveApi');
      await initGoogleIdentityServices(googleClientId);
      const token = await requestAccessToken();
      const folderId = await getOrCreateFlowForgeFolder(token);
      localStorage.setItem('flowforge_gdrive_folder', folderId);
      setDriveStatus('connected');
    } catch (e: any) {
      setDriveStatus('error');
      setErrorMsg(e.message || 'Drive connection failed');
    }
  };

  if (!isOpen) return null;

  const toolbarLabels: Record<keyof ToolbarVisibility, string> = {
    select: 'Select Tool (V)',
    pan: 'Pan Tool (Space)',
    note: 'Add Note',
    imageLibrary: 'Image Library',
    otherInput: 'Other Input (File)',
    run: 'Run Workflow (Play)',
    undoRedo: 'Undo / Redo',
    reload: 'Reload Models',
    settings: 'Settings Button',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-border-subtle w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-accent-lime" />
            <h2 className="text-lg font-semibold text-text-primary">Workflow & Toolbar Settings</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary hover:bg-white/10 p-1.5 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 2-Column Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Column 1: API & UI Preferences */}
          <div className="flex flex-col gap-6">
            {/* OpenRouter API Key */}
            <div className="flex flex-col gap-2 bg-canvas/40 border border-border-subtle rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <Key size={16} className="text-accent-lime" />
                <span>API Keys</span>
              </div>
              <p className="text-xs text-text-muted mb-3">Stored locally in your browser. Toggle to select the active key.</p>
              
              {/* List of keys */}
              {apiKeys && apiKeys.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {apiKeys.map((k) => (
                    <div key={k.id} className={`flex items-center justify-between p-2 rounded-xl border ${k.isActive ? 'border-accent-lime bg-accent-lime/10' : 'border-border-subtle bg-black/20'}`}>
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div 
                          className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${k.isActive ? 'border-accent-lime bg-accent-lime' : 'border-border-subtle hover:border-text-muted'}`}
                          onClick={() => setActiveApiKey(k.id)}
                        >
                          {k.isActive && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="text-xs text-text-primary font-medium truncate">{k.name}</span>
                          <span className="text-[10px] text-text-muted font-mono truncate">{k.key.substring(0, 10)}...{k.key.substring(k.key.length - 4)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeApiKey(k.id)}
                        className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-2"
                        title="Delete API Key"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Key */}
              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-border-subtle">
                <span className="text-xs font-medium text-text-muted">Add New Key</span>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Name (e.g. Work, Personal)"
                    className="w-1/3 bg-canvas border border-border-subtle rounded-xl px-3 py-2 text-xs outline-none focus:border-accent-lime text-text-primary placeholder:text-text-muted"
                    value={tempKeyName}
                    onChange={(e) => setTempKeyName(e.target.value)}
                  />
                  <input 
                    type="password"
                    placeholder="sk-or-v1-..."
                    className="flex-1 bg-canvas border border-border-subtle rounded-xl px-3 py-2 text-xs outline-none focus:border-accent-lime text-text-primary font-mono placeholder:font-sans placeholder:text-text-muted"
                    value={tempKey}
                    onChange={(e) => {
                      setTempKey(e.target.value);
                      setStatus('idle');
                    }}
                  />
                  <button 
                    onClick={checkAndAddKey}
                    disabled={status === 'checking' || !tempKey}
                    className="bg-white/10 hover:bg-white/20 text-text-primary px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {status === 'checking' ? '...' : 'Add'}
                  </button>
                </div>
              </div>
              
              {status === 'success' && (
                <div className="flex items-center gap-1.5 text-accent-lime text-xs mt-2">
                  <CheckCircle2 size={14} /> Key added successfully
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-1.5 text-danger text-xs mt-2">
                  <AlertCircle size={14} /> {errorMsg}
                </div>
              )}
            </div>

            {/* UI Behavior */}
            <div className="flex flex-col gap-3 bg-canvas/40 border border-border-subtle rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Layout size={16} className="text-accent-lime" />
                <span>UI Preferences</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-text-muted">Auto-open properties panel when selecting node</span>
                <div 
                  className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${autoOpenProperties ? 'bg-accent-lime' : 'bg-border-subtle'}`}
                  onClick={() => setAutoOpenProperties(!autoOpenProperties)}
                >
                  <div className={`w-3 h-3 rounded-full bg-black shadow-sm transform transition-transform ${autoOpenProperties ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>

            {/* Toolbar Buttons Visibility Customization */}
            <div className="flex flex-col gap-3 bg-canvas/40 border border-border-subtle rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Toolbar Customization</span>
                <span className="text-[10px] text-text-muted">Toggle tools on sidebar</span>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-1">
                {(Object.keys(DEFAULT_TOOLBAR_VISIBILITY) as (keyof ToolbarVisibility)[]).map((toolKey) => (
                  <div key={toolKey} className="flex items-center justify-between py-1 border-b border-border-subtle/50 last:border-none">
                    <span className="text-xs text-text-muted">{toolbarLabels[toolKey]}</span>
                    <div 
                      className={`w-7 h-3.5 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${toolbarVisibility[toolKey] !== false ? 'bg-accent-lime' : 'bg-border-subtle'}`}
                      onClick={() => setToolbarVisibility({ [toolKey]: toolbarVisibility[toolKey] === false })}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full bg-black shadow-sm transform transition-transform ${toolbarVisibility[toolKey] !== false ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Storage & Backup */}
          <div className="flex flex-col gap-6">
            {/* Local Storage */}
            <div className="flex flex-col gap-2 bg-canvas/40 border border-border-subtle rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                 <Database size={16} className="text-amber-400" />
                 <span>Local Storage (IndexedDB)</span>
              </div>
              <p className="text-xs text-text-muted">Generated images & media are stored in browser IndexedDB cache.</p>
              <div className="text-xs text-text-primary mt-2 font-mono bg-black/30 p-2.5 rounded-lg border border-white/5">
                {storageUsage}
              </div>
            </div>

            {/* Google Drive Backup */}
            <div className="flex flex-col gap-2 bg-canvas/40 border border-border-subtle rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                 <Cloud size={16} className="text-blue-400" />
                 <span>Google Drive Backup</span>
              </div>
              <p className="text-xs text-text-muted">Automatically upload generated media to your personal Google Drive folder.</p>
              
              <div className="flex flex-col gap-2 mt-2">
                <input 
                  type="text"
                  placeholder="Client ID (.apps.googleusercontent.com)"
                  className="w-full bg-canvas border border-border-subtle rounded-xl px-3 py-2 text-xs outline-none focus:border-accent-lime text-text-primary placeholder:font-sans placeholder:text-text-muted"
                  value={googleClientId}
                  onChange={(e) => {
                    setGoogleClientId(e.target.value);
                    if (driveStatus === 'error') setDriveStatus('idle');
                  }}
                />
                <button 
                  onClick={handleConnectDrive}
                  disabled={driveStatus === 'connecting' || !googleClientId || driveStatus === 'connected'}
                  className="w-full bg-white/10 hover:bg-white/20 text-text-primary px-4 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {driveStatus === 'connecting' ? 'Connecting...' : driveStatus === 'connected' ? 'Connected' : 'Connect to Google Drive'}
                </button>
              </div>
              {driveStatus === 'connected' && (
                <div className="flex items-center gap-1.5 text-accent-lime text-xs mt-1">
                  <CheckCircle2 size={14} /> Connected to Google Drive (FlowForge folder)
                </div>
              )}
              {driveStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-danger text-xs mt-1">
                  <AlertCircle size={14} /> {errorMsg}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors border border-border-subtle"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              setApiKey(tempKey);
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-text-primary text-canvas hover:bg-text-primary/90 transition-colors"
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
}

const DEFAULT_TOOLBAR_VISIBILITY: ToolbarVisibility = {
  select: true,
  pan: true,
  note: true,
  imageLibrary: true,
  otherInput: true,
  run: true,
  undoRedo: true,
  reload: true,
  settings: true,
};
