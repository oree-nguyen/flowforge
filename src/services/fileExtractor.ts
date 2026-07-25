/**
 * fileExtractor.ts
 * Client-side extraction of text content from various file formats.
 * Strategy: Phương án 1 – Direct Base64 Inline Transmission.
 *
 * For text-based formats (.txt, .md, .csv, .json): read as UTF-8 text and send inline.
 * For PDF: Extract text via pdfjs-dist; also store base64 for Claude models that accept PDF natively.
 * For DOCX: Extract raw text via mammoth.
 */

export interface ExtractedFile {
  name: string;
  mimeType: string;
  /** Plain text content (always populated when extraction succeeds). */
  text: string;
  /** Base64-encoded raw file bytes (populated for binary formats like PDF). */
  base64?: string;
  sizeBytes: number;
}

const TEXT_MIME_TYPES: Record<string, string> = {
  '.txt':  'text/plain',
  '.md':   'text/markdown',
  '.csv':  'text/csv',
  '.json': 'application/json',
  '.xml':  'text/xml',
  '.html': 'text/html',
};

function getExt(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

/** Read a File as a raw ArrayBuffer, then base64-encode it. */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const binary = reader.result as string;
      // FileReader.readAsDataURL returns  "data:<mime>;base64,<data>"
      // We want only the base64 part
      const comma = binary.indexOf(',');
      resolve(comma >= 0 ? binary.slice(comma + 1) : binary);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Read a File as UTF-8 text. */
async function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

/** Extract text from PDF via pdfjs-dist (lazy-imported). */
async function extractPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  // Set up worker (inline worker for Vite compatibility)
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(pageText);
  }

  return pageTexts.join('\n\n');
}

/** Extract text from DOCX via mammoth (lazy-imported). */
async function extractDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Main extraction function.
 * Returns { text, base64, name, mimeType, sizeBytes }.
 */
export async function extractFileContent(file: File): Promise<ExtractedFile> {
  const ext = getExt(file.name);

  // Plain text formats
  if (ext in TEXT_MIME_TYPES) {
    const text = await fileToText(file);
    return {
      name: file.name,
      mimeType: TEXT_MIME_TYPES[ext],
      text,
      sizeBytes: file.size,
    };
  }

  // PDF
  if (ext === '.pdf') {
    const [text, base64] = await Promise.all([
      extractPDF(file),
      fileToBase64(file),
    ]);
    return {
      name: file.name,
      mimeType: 'application/pdf',
      text,
      base64,
      sizeBytes: file.size,
    };
  }

  // DOCX / DOC
  if (ext === '.docx' || ext === '.doc') {
    const text = await extractDOCX(file);
    return {
      name: file.name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      text,
      sizeBytes: file.size,
    };
  }

  // Unknown – fall back to raw text read
  try {
    const text = await fileToText(file);
    return { name: file.name, mimeType: file.type || 'text/plain', text, sizeBytes: file.size };
  } catch {
    throw new Error(`Unsupported file format: ${ext || file.name}`);
  }
}

/** Accepted input file extensions (for <input accept="..."> attribute) */
export const ACCEPTED_FILE_TYPES = [
  '.txt', '.md', '.csv', '.json', '.xml',
  '.pdf', '.docx', '.doc',
].join(',');

/** Human-readable label for a file size */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
