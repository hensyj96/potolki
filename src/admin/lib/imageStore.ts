import { supabase } from '../../lib/supabase';

const BUCKET = 'gallery-images';
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const THUMB_WIDTH = 480;
const THUMB_HEIGHT = 360;
const MAIN_QUALITY = 0.85;
const THUMB_QUALITY = 0.75;
const PREFERRED_MIME = 'image/webp';
const FALLBACK_MIME = 'image/jpeg';

export type StoredImage = {
  /** Storage object path (`<id>.webp` / `<id>_thumb.webp`) */
  path: string;
  /** Public CDN URL */
  publicUrl: string;
  width: number;
  height: number;
  size: number;
  mime: string;
};

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

function fitWithin(srcW: number, srcH: number, maxW: number, maxH: number) {
  const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
  return { w: Math.round(srcW * ratio), h: Math.round(srcH * ratio) };
}

async function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`Canvas toBlob failed for ${mime}`))),
      mime,
      quality
    );
  });
}

async function encode(canvas: HTMLCanvasElement, quality: number): Promise<{ blob: Blob; mime: string; ext: string }> {
  try {
    const blob = await canvasToBlob(canvas, PREFERRED_MIME, quality);
    if (blob.type.includes('webp')) return { blob, mime: PREFERRED_MIME, ext: 'webp' };
  } catch {
    /* fall back to jpeg */
  }
  const blob = await canvasToBlob(canvas, FALLBACK_MIME, quality);
  return { blob, mime: FALLBACK_MIME, ext: 'jpg' };
}

async function renderToBlob(img: HTMLImageElement, maxW: number, maxH: number, quality: number) {
  const { w, h } = fitWithin(img.naturalWidth, img.naturalHeight, maxW, maxH);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const { blob, mime, ext } = await encode(canvas, quality);
  return { blob, mime, ext, width: w, height: h };
}

async function uploadToStorage(blob: Blob, path: string, mime: string): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: mime,
    cacheControl: '31536000', // 1 year
    upsert: false,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Optimizes a File or Blob and uploads main + thumb to Supabase Storage.
 * Returns paths and public URLs for both.
 */
export async function optimizeAndStore(file: File | Blob): Promise<{ main: StoredImage; thumb: StoredImage; src: string; thumbSrc: string }> {
  const img = await loadImage(file);
  try {
    const id = generateId();

    const main = await renderToBlob(img, MAX_WIDTH, MAX_HEIGHT, MAIN_QUALITY);
    const thumb = await renderToBlob(img, THUMB_WIDTH, THUMB_HEIGHT, THUMB_QUALITY);

    const mainPath = `${id}.${main.ext}`;
    const thumbPath = `${id}_thumb.${thumb.ext}`;

    const [mainUrl, thumbUrl] = await Promise.all([
      uploadToStorage(main.blob, mainPath, main.mime),
      uploadToStorage(thumb.blob, thumbPath, thumb.mime),
    ]);

    return {
      main: { path: mainPath, publicUrl: mainUrl, width: main.width, height: main.height, size: main.blob.size, mime: main.mime },
      thumb: { path: thumbPath, publicUrl: thumbUrl, width: thumb.width, height: thumb.height, size: thumb.blob.size, mime: thumb.mime },
      src: mainUrl,
      thumbSrc: thumbUrl,
    };
  } finally {
    if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
  }
}

/** Removes objects associated with a gallery item from Storage. */
export async function deleteImageRefs(item: { src?: string; thumb_src?: string | null; thumbSrc?: string | null }) {
  const paths: string[] = [];
  const fromUrl = (url?: string | null) => {
    if (!url) return null;
    const idx = url.indexOf(`/${BUCKET}/`);
    if (idx < 0) return null;
    return url.slice(idx + BUCKET.length + 2).split('?')[0];
  };
  const m = fromUrl(item.src);
  if (m) paths.push(m);
  const t = fromUrl(item.thumb_src ?? item.thumbSrc ?? null);
  if (t) paths.push(t);
  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths);
}
