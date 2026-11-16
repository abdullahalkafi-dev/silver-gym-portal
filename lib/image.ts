const MAX_SIDE = 1280;
const SKIP_BELOW_BYTES = 600 * 1024;

/**
 * Shrinks a phone photo before upload. Camera photos are often 4-10 MB, but the server accepts 5 MB,
 * and a small 1280px picture is plenty for a profile photo. Falls back to the original file when the
 * browser cannot read the image (the server then checks it).
 */
export async function prepareProfilePhoto(file: File): Promise<File> {
  if (file.size <= SKIP_BELOW_BYTES && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], "profile.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
