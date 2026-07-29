import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoading = false;

/**
 * Singleton getter for FFmpeg WASM single-thread instance
 */
export async function getFFmpeg(
  onProgress?: (percent: number, message: string) => void
): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  if (isFFmpegLoading) {
    while (isFFmpegLoading) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (ffmpegInstance && ffmpegInstance.loaded) return ffmpegInstance;
  }

  isFFmpegLoading = true;
  onProgress?.(5, 'Đang nạp thư viện FFmpeg WASM...');

  const ffmpeg = new FFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
    onProgress?.(pct, `FFmpeg đang xử lý video (${pct}%)...`);
  });

  try {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  } finally {
    isFFmpegLoading = false;
  }
}

/**
 * Extract 1 frame thumbnail at 0.1s using HTML5 Canvas (Instant & fast)
 */
export async function extractVideoThumbnail(videoBlobOrUrl: Blob | string): Promise<string> {
  const videoEl = document.createElement('video');
  const srcUrl = typeof videoBlobOrUrl === 'string' ? videoBlobOrUrl : URL.createObjectURL(videoBlobOrUrl);
  videoEl.src = srcUrl;
  videoEl.crossOrigin = 'anonymous';
  videoEl.muted = true;
  videoEl.currentTime = 0.1;

  await new Promise((resolve) => {
    videoEl.onloadeddata = () => resolve(true);
    videoEl.onerror = () => resolve(false);
  });

  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Concatenate multiple video clips using FFmpeg WASM concat filter
 */
export async function concatVideosWithFFmpeg(
  clips: { url: string; id: string }[],
  resolution: '720p' | '1080p' = '720p',
  onProgress?: (percent: number, message: string) => void
): Promise<string> {
  if (clips.length === 0) {
    throw new Error('Danh sách video trống.');
  }

  const ffmpeg = await getFFmpeg(onProgress);

  const targetWidth = resolution === '1080p' ? 1920 : 1280;
  const targetHeight = resolution === '1080p' ? 1080 : 720;

  // Step 1: Write all clip files to FFmpeg Virtual Filesystem
  onProgress?.(15, `Đang nạp ${clips.length} file video vào bộ nhớ...`);
  const inputNames: string[] = [];

  for (let i = 0; i < clips.length; i++) {
    const inputName = `input_${i}.mp4`;
    inputNames.push(inputName);

    const fileData = await fetchFile(clips[i].url);
    await ffmpeg.writeFile(inputName, fileData);
  }

  // Step 2: Build FFmpeg filter_complex concat graph
  onProgress?.(30, 'Đang chuẩn hóa định dạng & ghép các phân cảnh...');

  // Build filter graph:
  // [0:v]scale=1280:720,fps=30,setsar=1[v0]; [1:v]scale=1280:720,fps=30,setsar=1[v1]; ...
  // [v0][0:a][v1][1:a]...concat=n=N:v=1:a=1[outv][outa]
  const scaleFilters = inputNames
    .map((_, i) => `[${i}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,fps=30,setsar=1[v${i}]`)
    .join('; ');

  const concatInputs = inputNames.map((_, i) => `[v${i}][${i}:a]`).join('');
  const filterGraph = `${scaleFilters}; ${concatInputs}concat=n=${inputNames.length}:v=1:a=1[outv][outa]`;

  const args: string[] = [];
  inputNames.forEach((name) => {
    args.push('-i', name);
  });

  args.push(
    '-filter_complex', filterGraph,
    '-map', '[outv]',
    '-map', '[outa]',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    'output.mp4'
  );

  await ffmpeg.exec(args);

  // Step 3: Read output file from virtual FS
  onProgress?.(95, 'Đang xuất file video hoàn chỉnh...');
  const data = await ffmpeg.readFile('output.mp4');

  // Clean up virtual files
  for (const name of inputNames) {
    try {
      await ffmpeg.deleteFile(name);
    } catch {}
  }
  try {
    await ffmpeg.deleteFile('output.mp4');
  } catch {}

  const outputBlob = new Blob([data as any], { type: 'video/mp4' });
  return URL.createObjectURL(outputBlob);
}
