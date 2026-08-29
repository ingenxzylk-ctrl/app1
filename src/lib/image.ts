const MAX_EDGE = 1280;
const QUALITY = 0.84;

export async function fileToCompressedDataUrl(file: File | Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
}

export function dataUrlSizeKb(dataUrl: string): number {
  return Math.round((dataUrl.length * 3) / 4 / 1024);
}
