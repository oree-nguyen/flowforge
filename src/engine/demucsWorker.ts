import * as ort from 'onnxruntime-web';

// Cấu hình đường dẫn tới WASM binaries trên CDN để không phải bundle
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/';

const MODEL_URL = 'https://huggingface.co/sevagh/htdemucs-onnx/resolve/main/htdemucs.onnx'; // Or a similar valid HTDemucs ONNX

let session: ort.InferenceSession | null = null;

// Gửi event progress về main thread
function reportProgress(status: string, progress: number) {
  postMessage({ type: 'progress', status, progress });
}

// Hàm khởi tạo và tải model (có lưu cache)
async function initModel() {
  if (session) return;
  
  reportProgress('Đang kiểm tra cache mô hình...', 5);
  
  // Dùng Cache API để lưu trữ model ONNX (khoảng >100MB)
  const cacheName = 'flowforge-ai-models-v1';
  const cache = await caches.open(cacheName);
  let response = await cache.match(MODEL_URL);
  
  if (!response) {
    reportProgress('Đang tải mô hình từ HuggingFace (Vui lòng chờ)...', 10);
    response = await fetch(MODEL_URL);
    if (!response.ok) throw new Error(`Không thể tải mô hình: ${response.statusText}`);
    // Lưu vào cache để lần sau khỏi tải
    await cache.put(MODEL_URL, response.clone());
  }
  
  const buffer = await response.arrayBuffer();
  reportProgress('Đang khởi tạo ONNX runtime...', 50);
  
  session = await ort.InferenceSession.create(buffer, {
    executionProviders: ['wasm'], // Có thể thử 'webgl' hoặc 'webgpu' nếu có, nhưng 'wasm' ổn định nhất
    graphOptimizationLevel: 'all',
  });
  
  reportProgress('Khởi tạo mô hình thành công!', 100);
}

// Xử lý chunk (ví dụ)
async function processAudio(audioBuffer: Float32Array, _channels: number, _sampleRate: number) {
  if (!session) throw new Error('Model chưa được tải.');
  
  reportProgress('Đang xử lý âm thanh (Đang chuẩn bị tensor)...', 0);
  
  // HTDemucs thường yêu cầu stereo (2 kênh), sample rate 44100
  // Tensor input: [1, 2, time]
  
  // Lưu ý: Triển khai thực tế cần chunking với overlap-add vì bộ nhớ web worker có hạn
  // Dưới đây là mô hình hoá việc chunking & inference (Mock logic nếu model quá nặng hoặc xử lý thực nếu model hỗ trợ)
  
  // Demo processing loop cho progress bar
  const totalChunks = 10;
  for (let i = 0; i < totalChunks; i++) {
    await new Promise(r => setTimeout(r, 500)); // Giả lập inference delay
    reportProgress('Đang xử lý âm thanh...', Math.round(((i + 1) / totalChunks) * 100));
  }
  
  // TODO: Implement actual tensor operations
  // Vì việc decode WAV/Float32 trực tiếp và chạy inference onnx trong JS khá cồng kềnh (cần AudioBuffer main thread).
  // Trong Web Worker, chúng ta nhận Float32Array từ main thread, tái cấu trúc thành Tensor, chạy, và trả về Float32Array mới.
  
  return {
    vocals: audioBuffer, // Giả lập trả về chính nó
    instrumental: audioBuffer // Giả lập trả về chính nó
  };
}

onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;
  
  try {
    if (type === 'init') {
      await initModel();
      postMessage({ type: 'ready', id });
    } else if (type === 'process') {
      const { audioData, channels, sampleRate } = payload;
      const result = await processAudio(audioData, channels, sampleRate);
      
      postMessage({ 
        type: 'complete', 
        id, 
        payload: {
          vocals: result.vocals,
          instrumental: result.instrumental,
        }
      });
    }
  } catch (error: any) {
    postMessage({ type: 'error', id, error: error.message });
  }
};
