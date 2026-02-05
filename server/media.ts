import fs from "fs/promises";
import path from "path";
import type { Request } from "express";
import { MAX_MEDIA_BYTES, MAX_MEDIA_LABEL } from "@shared/media";

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
};

export function inferMediaType(
  contentType: string | undefined,
  fallbackType?: "photo" | "video",
): "photo" | "video" | null {
  if (contentType?.startsWith("image/")) {
    return "photo";
  }
  if (contentType?.startsWith("video/")) {
    return "video";
  }
  return fallbackType ?? null;
}

export function uploadsEnabled(): boolean {
  const configured = process.env.UPLOADS_ENABLED?.trim();
  if (configured && configured.length > 0) {
    return configured.toLowerCase() === "true";
  }

  if (process.env.VERCEL) {
    return false;
  }

  return true;
}

export function getUploadsRoot(): string {
  const configured = process.env.UPLOADS_ROOT?.trim();
  return configured && configured.length > 0
    ? configured
    : path.resolve(process.cwd(), "public", "uploads");
}

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "-");
  return sanitized.length > 0 ? sanitized : `upload-${Date.now()}`;
}

function stripDataUrlPrefix(data: string): string {
  const match = data.match(/^data:.*;base64,(.*)$/);
  return match ? match[1] : data;
}

function extractContentType(data: string): string | undefined {
  const match = data.match(/^data:([^;]+);base64,/);
  return match ? match[1] : undefined;
}

function ensureExtension(filename: string, contentType?: string): string {
  if (path.extname(filename)) {
    return filename;
  }

  const ext = contentType ? EXTENSION_MAP[contentType] : "";
  return ext ? `${filename}${ext}` : filename;
}

export async function ensureMeetUploadDir(meetId: number): Promise<string> {
  const dir = path.join(getUploadsRoot(), String(meetId));
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function saveBase64Upload(params: {
  meetId: number;
  filename: string;
  contentType?: string;
  data: string;
}): Promise<{
  url: string;
  type: "photo" | "video";
  originalFilename: string;
}> {
  const sanitized = sanitizeFilename(params.filename);
  const derivedContentType = params.contentType ?? extractContentType(params.data);
  const finalName = ensureExtension(sanitized, derivedContentType);
  const type = inferMediaType(derivedContentType);

  if (!type) {
    throw new Error("Unsupported media type. Only images and videos are allowed.");
  }

  const raw = stripDataUrlPrefix(params.data);
  const buffer = Buffer.from(raw, "base64");

  if (buffer.byteLength > MAX_MEDIA_BYTES) {
    throw new Error(`File is too large. Max upload size is ${MAX_MEDIA_LABEL}.`);
  }

  const dir = await ensureMeetUploadDir(params.meetId);
  const filename = `${Date.now()}-${finalName}`;
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, buffer);

  return {
    url: `/uploads/${params.meetId}/${filename}`,
    type,
    originalFilename: params.filename,
  };
}

export async function removeLocalUpload(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith("/uploads/")) {
    return;
  }

  if (url.includes("..")) {
    return;
  }

  const relativePath = url.replace(/^\/uploads\//, "");
  const fullPath = path.resolve(getUploadsRoot(), relativePath);

  try {
    await fs.unlink(fullPath);
  } catch {
    // Ignore missing files
  }
}

export function isValidRemoteUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveMediaUrl(
  req: Request | null,
  url: string | null | undefined,
): string | null | undefined {
  if (!url) {
    return url;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (!url.startsWith("/uploads/")) {
    return url;
  }

  const mediaBase = process.env.MEDIA_BASE_URL?.trim();
  if (mediaBase) {
    return `${mediaBase.replace(/\/$/, "")}${url}`;
  }

  if (req) {
    const host = req.get("host");
    if (host) {
      const protocol = req.protocol || (req.secure ? "https" : "http");
      return `${protocol}://${host}${url}`;
    }
  }

  return url;
}
