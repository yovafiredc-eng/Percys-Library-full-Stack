import sharp from "sharp";

let sharpInstance: typeof sharp;
try {
  sharpInstance = sharp;
} catch {
  sharpInstance = null as any;
  console.warn("[image-utils] sharp not available - image processing disabled");
}

export async function makeThumbnail(input: Buffer, width: number): Promise<Buffer> {
  if (!sharpInstance) throw new Error("Image processing unavailable");
  const isSmall = input.length < 100 * 1024;
  const quality = isSmall ? 85 : 78;
  const effort = isSmall ? 4 : 3;
  return sharpInstance(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort, alphaQuality: 100 })
    .toBuffer();
}

export async function normalizeImage(input: Buffer): Promise<{ data: Buffer; mime: string }> {
  const sourceMime = detectMime(input);
  if (sourceMime !== "application/octet-stream") {
    return { data: input, mime: sourceMime };
  }
  if (!sharpInstance) throw new Error("Image processing unavailable");
  const data = await sharpInstance(input).rotate().png().toBuffer();
  return { data, mime: "image/png" };
}

export async function autoCropWhiteMargins(input: Buffer): Promise<Buffer> {
  if (!sharpInstance) throw new Error("Image processing unavailable");
  return sharpInstance(input).trim({ background: "white", threshold: 18 }).toBuffer();
}

/**
 * Recompress a page through Sharp at the requested quality tier:
 *  - "high"      → original buffer (no recompress; fast path)
 *  - "balanced"  → resize to max 1600px wide, WebP q=75, effort=4
 *  - "fast"      → resize to max 1100px wide, WebP q=65, effort=3
 *
 * Aggressive compression: effort=3-4 for max reduction, alphaQuality=100
 * for transparency, and dynamic quality based on file size.
 */
export async function recompressForQuality(
  input: Buffer,
  tier: "high" | "balanced" | "fast",
): Promise<Buffer> {
  if (tier === "high") return input;
  if (!sharpInstance) return input;
  const targetWidth = tier === "balanced" ? 1600 : 1100;
  const quality = tier === "balanced" ? 75 : 65;
  const effort = 4;
  try {
    const out = await sharpInstance(input)
      .rotate()
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality, effort, alphaQuality: 100 })
      .toBuffer();
    return out.length < input.length ? out : input;
  } catch {
    return input;
  }
}

export function detectMime(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  return "application/octet-stream";
}
