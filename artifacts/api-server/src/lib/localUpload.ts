/**
 * Local filesystem upload fallback for production servers that don't have
 * the Replit GCS sidecar (http://127.0.0.1:1106).
 *
 * Files are stored in LOCAL_UPLOAD_DIR (default: /opt/ayyappan-api/uploads).
 * The objectPath format is `/local-uploads/<uuid>` which maps to the
 * `/api/storage/local-uploads/:id` serving endpoint.
 */
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const SIDECAR_URL = "http://127.0.0.1:1106";

/** Cache so we only probe once per process lifetime */
let _sidecarAvailable: boolean | null = null;

export async function isSidecarAvailable(): Promise<boolean> {
  if (_sidecarAvailable !== null) return _sidecarAvailable;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 500);
    const res = await fetch(`${SIDECAR_URL}/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    _sidecarAvailable = res.ok;
  } catch {
    _sidecarAvailable = false;
  }
  return _sidecarAvailable;
}

export function getLocalUploadDir(): string {
  return process.env.LOCAL_UPLOAD_DIR ?? "/opt/ayyappan-api/uploads";
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(getLocalUploadDir(), { recursive: true });
}

/**
 * Returns { uploadURL, objectPath } for a local-storage upload.
 * uploadURL  — the API endpoint the browser should PUT the file to.
 * objectPath — the path stored in the DB and passed to screenshotUrl().
 */
export function createLocalUploadSlot(apiBase: string): {
  uploadURL: string;
  objectPath: string;
} {
  const id = randomUUID();
  return {
    uploadURL: `${apiBase}/donations/local-upload/${id}`,
    objectPath: `/local-uploads/${id}`,
  };
}

export async function saveLocalUpload(
  id: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  await ensureUploadDir();
  const dir = getLocalUploadDir();
  // Save file content
  await fs.writeFile(path.join(dir, id), data);
  // Save metadata (content type) alongside
  await fs.writeFile(
    path.join(dir, `${id}.meta`),
    JSON.stringify({ contentType })
  );
}

export async function readLocalUpload(
  id: string
): Promise<{ data: Buffer; contentType: string } | null> {
  const dir = getLocalUploadDir();
  try {
    const [data, metaRaw] = await Promise.all([
      fs.readFile(path.join(dir, id)),
      fs.readFile(path.join(dir, `${id}.meta`), "utf8"),
    ]);
    const { contentType } = JSON.parse(metaRaw);
    return { data, contentType };
  } catch {
    return null;
  }
}
