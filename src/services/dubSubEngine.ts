import { transcribeAudio, chatCompletion, generateSpeech } from './openRouterApi';
import type { TranscriptSegment, SpeakerCasting } from '../types/nodes';

/**
 * Encodes an AudioBuffer into a WAV Blob (16-bit PCM).
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let sampleRate = audioBuffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit resolution
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  while (offset < audioBuffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Step 1: Extract Audio WAV from Video source
 */
export async function extractAudioFromVideo(videoUrlOrBlob: string | Blob): Promise<{ audioBlob: Blob; audioBuffer: AudioBuffer }> {
  let arrayBuffer: ArrayBuffer;

  if (typeof videoUrlOrBlob === 'string') {
    const res = await fetch(videoUrlOrBlob);
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = await videoUrlOrBlob.arrayBuffer();
  }

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  const wavBlob = audioBufferToWavBlob(audioBuffer);
  await audioCtx.close();

  return { audioBlob: wavBlob, audioBuffer };
}

/**
 * Step 2: Perform STT with Diarization
 */
export async function performSTTWithDiarization(
  apiKey: string,
  sttModel: string,
  audioBlob: Blob,
  sourceLanguage: string
): Promise<TranscriptSegment[]> {
  const result = await transcribeAudio(apiKey, sttModel, audioBlob, sourceLanguage);

  const segments: TranscriptSegment[] = [];

  if (result.segments && Array.isArray(result.segments)) {
    result.segments.forEach((seg: any) => {
      // If speaker diarization is available in response (e.g. speaker / speaker_id)
      const speakerId = seg.speaker || seg.speaker_id || seg.speakerId || 'SPEAKER_00';
      segments.push({
        start: seg.start || 0,
        end: seg.end || 0,
        text: (seg.text || '').trim(),
        speakerId: String(speakerId).toUpperCase(),
        translations: {},
      });
    });
  } else if (result.text) {
    // Fallback if no segments returned
    segments.push({
      start: 0,
      end: result.duration || 10,
      text: result.text.trim(),
      speakerId: 'SPEAKER_00',
      translations: {},
    });
  }

  return segments;
}

/**
 * Cut audio sample slice for voice casting audio preview
 */
export async function cutSpeakerSample(audioBuffer: AudioBuffer, start: number, end: number): Promise<string> {
  const duration = Math.max(0.5, Math.min(5, end - start));
  const sampleRate = audioBuffer.sampleRate;
  const frameCount = Math.floor(duration * sampleRate);

  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    frameCount,
    sampleRate
  );

  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.connect(offlineCtx.destination);
  sourceNode.start(0, start, duration);

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  return URL.createObjectURL(wavBlob);
}

/**
 * Step 4: Translate segments to target languages
 */
export async function translateSegments(
  apiKey: string,
  translateModel: string,
  segments: TranscriptSegment[],
  targetLangs: string[]
): Promise<TranscriptSegment[]> {
  if (targetLangs.length === 0) return segments;

  const prompt = `You are a professional video translator and subtitle localizer.
Translate the following video subtitle segments into target languages: ${targetLangs.join(', ')}.

Input Segments:
${JSON.stringify(segments.map(s => ({ id: `${s.start}-${s.end}`, text: s.text, speakerId: s.speakerId })), null, 2)}

Requirements:
1. Maintain exact tone and natural phrasing per speaker.
2. Return JSON ONLY as an array of objects matching this exact structure:
[
  {
    "start": number,
    "end": number,
    "speakerId": string,
    "text": string,
    "translations": {
      ${targetLangs.map(l => `"${l}": "translated text"`).join(',\n      ')}
    }
  }
]`;

  try {
    const res = await chatCompletion(apiKey, translateModel, [
      { role: 'user', content: prompt }
    ], { response_format: { type: 'json_object' } });

    const content = res.choices?.[0]?.message?.content || '';
    let parsed: any[];

    try {
      const match = content.match(/\[[\s\S]*\]/);
      parsed = JSON.parse(match ? match[0] : content);
    } catch {
      parsed = [];
    }

    return segments.map((seg, idx) => {
      const translatedItem = parsed[idx];
      const translations: Record<string, string> = { ...seg.translations };

      if (translatedItem && translatedItem.translations) {
        targetLangs.forEach(lang => {
          if (translatedItem.translations[lang]) {
            translations[lang] = translatedItem.translations[lang];
          }
        });
      }

      // Fallback if missing
      targetLangs.forEach(lang => {
        if (!translations[lang]) {
          translations[lang] = seg.text;
        }
      });

      return {
        ...seg,
        translations,
      };
    });
  } catch (err) {
    console.warn('Translation JSON failed, fallback to original text:', err);
    return segments.map(seg => ({
      ...seg,
      translations: targetLangs.reduce((acc, l) => ({ ...acc, [l]: seg.text }), {}),
    }));
  }
}

/**
 * Format timestamps into SRT / VTT timecodes
 */
function formatTimecode(seconds: number, isVtt: boolean = false): string {
  const pad = (n: number, width: number = 2) => String(Math.floor(n)).padStart(width, '0');
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const msSep = isVtt ? '.' : ',';
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}${msSep}${pad(ms, 3)}`;
}

/**
 * Export subtitle file (.srt / .vtt)
 */
export function exportSubtitle(
  segments: TranscriptSegment[],
  lang: string,
  format: 'srt' | 'vtt' = 'srt',
  includeSpeakerName: boolean = false,
  speakersMap: Record<string, string> = {}
): string {
  const isVtt = format === 'vtt';
  let lines: string[] = [];

  if (isVtt) {
    lines.push('WEBVTT\n');
  }

  segments.forEach((seg, idx) => {
    const text = seg.translations[lang] || seg.text;
    if (!text.trim()) return;

    const speakerName = speakersMap[seg.speakerId] || seg.speakerId;
    const speakerPrefix = includeSpeakerName ? `[${speakerName}]: ` : '';

    if (isVtt) {
      lines.push(`${formatTimecode(seg.start, true)} --> ${formatTimecode(seg.end, true)}`);
      lines.push(`${speakerPrefix}${text}\n`);
    } else {
      lines.push(`${idx + 1}`);
      lines.push(`${formatTimecode(seg.start, false)} --> ${formatTimecode(seg.end, false)}`);
      lines.push(`${speakerPrefix}${text}\n`);
    }
  });

  return lines.join('\n');
}

/**
 * Step 5 & 6: TTS per segment, time-stretch alignment & combine into single WAV audio
 */
export async function generateDubbedAudio(
  apiKey: string,
  ttsModel: string,
  segments: TranscriptSegment[],
  speakers: SpeakerCasting[],
  lang: string,
  totalDuration: number,
  onProgress?: (curr: number, total: number) => void
): Promise<Blob> {
  const speakerVoiceMap: Record<string, string> = {};
  speakers.forEach(sp => {
    speakerVoiceMap[sp.speakerId] = sp.voiceIdPerLanguage[lang] || sp.voiceIdPerLanguage['en'] || 'alloy';
  });

  const audioCtx = new OfflineAudioContext(
    2,
    Math.ceil((totalDuration + 5) * 44100),
    44100
  );

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const text = seg.translations[lang] || seg.text;
    if (!text.trim()) continue;

    onProgress?.(i + 1, segments.length);

    const voice = speakerVoiceMap[seg.speakerId] || 'alloy';
    try {
      const speechBlob = await generateSpeech(apiKey, ttsModel, text, voice);
      const arrayBuf = await speechBlob.arrayBuffer();
      const decodedBuf = await audioCtx.decodeAudioData(arrayBuf);

      const targetDuration = Math.max(0.2, seg.end - seg.start);
      const originalDuration = decodedBuf.duration;

      // Calculate time stretch ratio (clamped 0.5x to 2.0x)
      let stretchRate = originalDuration / targetDuration;
      stretchRate = Math.max(0.5, Math.min(2.0, stretchRate));

      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = decodedBuf;
      sourceNode.playbackRate.value = stretchRate;

      sourceNode.connect(audioCtx.destination);
      sourceNode.start(seg.start);
    } catch (err) {
      console.warn(`TTS generation failed for segment ${i}:`, err);
    }
  }

  const renderedBuffer = await audioCtx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}

/**
 * Step 7: Mux video stream with dubbed audio
 */
export async function muxAudioWithVideo(
  videoUrlOrBlob: string | Blob,
  dubbedAudioBlob: Blob,
  mixOriginal: boolean
): Promise<string> {
  // Return ObjectURL for video element with audio mixing or direct audio track overlay
  const videoEl = document.createElement('video');
  videoEl.src = typeof videoUrlOrBlob === 'string' ? videoUrlOrBlob : URL.createObjectURL(videoUrlOrBlob);
  videoEl.crossOrigin = 'anonymous';
  videoEl.muted = !mixOriginal;

  const audioEl = document.createElement('audio');
  audioEl.src = URL.createObjectURL(dubbedAudioBlob);

  await new Promise((resolve) => {
    videoEl.onloadedmetadata = () => resolve(true);
  });

  const stream = (videoEl as any).captureStream ? (videoEl as any).captureStream() : (videoEl as any).mozCaptureStream();
  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();

  if (mixOriginal) {
    const origSource = audioCtx.createMediaElementSource(videoEl);
    const origGain = audioCtx.createGain();
    origGain.gain.value = 0.15; // -20dB original background audio
    origSource.connect(origGain);
    origGain.connect(dest);
  }

  const dubSource = audioCtx.createMediaElementSource(audioEl);
  const dubGain = audioCtx.createGain();
  dubGain.gain.value = 1.0;
  dubSource.connect(dubGain);
  dubGain.connect(dest);

  const combinedStream = new MediaStream([
    ...stream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => chunks.push(e.data);

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: 'video/webm' });
      resolve(URL.createObjectURL(finalBlob));
    };

    recorder.onerror = (e) => reject(e);

    videoEl.currentTime = 0;
    audioEl.currentTime = 0;

    recorder.start();
    videoEl.play();
    audioEl.play();

    videoEl.onended = () => {
      recorder.stop();
    };
  });
}
