import { apiService } from "./api";

export interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  logId?: string;
  error?: string;
}

/**
 * Optional: set this from your env/config if your bucket is public.
 * Example: "https://<project>.supabase.co/storage/v1/object/public"
 */
const PUBLIC_STORAGE_URL_BASE =
  (import.meta as any)?.env?.VITE_PUBLIC_STORAGE_URL_BASE ||
  (window as any)?.PUBLIC_STORAGE_URL_BASE ||
  "";

function isString(v: any): v is string {
  return typeof v === "string" && v.length > 0;
}

function looksLikeUrl(v: any): v is string {
  return isString(v) && /^(https?:)?\/\//i.test(v);
}

function buildPublicUrl(bucket?: string, path?: string): string | undefined {
  if (
    !isString(PUBLIC_STORAGE_URL_BASE) ||
    !isString(bucket) ||
    !isString(path)
  )
    return;
  // Ensure no double slashes
  const base = PUBLIC_STORAGE_URL_BASE.replace(/\/+$/, "");
  const b = bucket.replace(/^\/+|\/+$/g, "");
  const p = path.replace(/^\/+/, "");
  return `${base}/${b}/${p}`;
}

function pickFirstKey<T = any>(obj: any, keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  return undefined;
}

function normalizePayload(
  raw: any
): { fileUrl?: string; logId?: string } | null {
  if (!raw || typeof raw !== "object") return null;

  // If wrapped: { success, data: {...} }
  const payload =
    "data" in raw && raw.data && typeof raw.data === "object" ? raw.data : raw;

  // 1) Direct URL candidates
  const directUrl =
    pickFirstKey<string>(payload, [
      "fileUrl",
      "publicUrl",
      "signedUrl",
      "url",
    ]) ||
    // Sometimes nested: payload.data.url
    (payload.data &&
      pickFirstKey<string>(payload.data, [
        "fileUrl",
        "publicUrl",
        "signedUrl",
        "url",
      ]));

  if (looksLikeUrl(directUrl)) {
    return {
      fileUrl: directUrl,
      logId:
        pickFirstKey<string>(payload, ["logId", "file_id", "id"]) ||
        (payload.data &&
          pickFirstKey<string>(payload.data, ["logId", "file_id", "id"])),
    };
  }

  // 2) Construct from bucket + path/objectPath/key if bucket is public
  const bucket =
    pickFirstKey<string>(payload, ["bucket", "bucketName"]) ||
    (payload.data &&
      pickFirstKey<string>(payload.data, ["bucket", "bucketName"]));
  const path =
    pickFirstKey<string>(payload, ["path", "objectPath", "key", "name"]) ||
    (payload.data &&
      pickFirstKey<string>(payload.data, [
        "path",
        "objectPath",
        "key",
        "name",
      ]));

  const built = buildPublicUrl(bucket, path);
  if (isString(built)) {
    return {
      fileUrl: built,
      logId:
        pickFirstKey<string>(payload, ["logId", "file_id", "id"]) ||
        (payload.data &&
          pickFirstKey<string>(payload.data, ["logId", "file_id", "id"])),
    };
  }
  return null;
}

class UploadApiService {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiService.postForm<any>("/upload/file", formData);
      if (res && typeof res === "object" && "success" in res) {
        if (res.success) {
          const norm = normalizePayload(res);
          if (norm?.fileUrl) {
            return { success: true, fileUrl: norm.fileUrl, logId: norm.logId };
          }
          return {
            success: false,
            error: "Upload succeeded but no URL returned",
          };
        }
        return { success: false, error: res.error || "File upload failed" };
      }
      const norm = normalizePayload(res);
      if (norm?.fileUrl) {
        return { success: true, fileUrl: norm.fileUrl, logId: norm.logId };
      }

      return { success: false, error: "Unexpected upload response shape" };
    } catch (e: any) {
      return { success: false, error: e?.message || "Upload request failed" };
    }
  }
}

export const uploadApi = new UploadApiService();
