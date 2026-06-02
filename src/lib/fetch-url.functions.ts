import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "documents";
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

const inputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Please paste a link.")
    .max(2048, "That link is too long.")
    .url("That doesn't look like a valid URL."),
});

/** Resolve provider share links to a direct-download URL. */
function normalizeUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }
  const host = u.hostname.toLowerCase();

  // Google Drive file links → direct download
  if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
    // /file/d/{id}/...
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    const id = m?.[1] ?? u.searchParams.get("id");
    if (id) {
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }
  }

  // Dropbox → force direct download
  if (host.includes("dropbox.com")) {
    u.searchParams.set("dl", "1");
    return u.toString();
  }
  if (host.includes("dl.dropboxusercontent.com")) {
    return u.toString();
  }

  return u.toString();
}

function extOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

function sanitizeName(name: string): string {
  const cleaned = name.replace(/[^\w.\-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "download";
}

/** Try to pull a filename out of a Content-Disposition header. */
function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = header.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/["']/g, "").trim());
    } catch {
      /* ignore */
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() ?? null;
}

function filenameFromUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {
    /* ignore */
  }
  return "download";
}

export const fetchDocumentFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const original = new URL(data.url);

    if (original.protocol !== "http:" && original.protocol !== "https:") {
      throw new Error("Only http(s) links are supported.");
    }

    // Google Drive folder links can't be downloaded from a plain URL.
    if (
      original.hostname.toLowerCase().includes("drive.google.com") &&
      original.pathname.includes("/folders/")
    ) {
      throw new Error(
        "Folder import isn't supported yet — please paste a link to a single file.",
      );
    }

    const target = normalizeUrl(data.url);

    let res: Response;
    try {
      res = await fetch(target, { redirect: "follow" });
    } catch {
      throw new Error("Couldn't reach that link. Check the URL and try again.");
    }

    if (!res.ok) {
      throw new Error(
        `Couldn't download the file (HTTP ${res.status}). Make sure the link is publicly shared.`,
      );
    }

    const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
    const declaredLength = Number(res.headers.get("content-length") ?? "0");
    if (declaredLength && declaredLength > MAX_BYTES) {
      throw new Error("That file is larger than the 100 MB limit.");
    }

    const buffer = new Uint8Array(await res.arrayBuffer());
    if (buffer.byteLength === 0) {
      throw new Error("The download was empty. Make sure the link is publicly shared.");
    }
    if (buffer.byteLength > MAX_BYTES) {
      throw new Error("That file is larger than the 100 MB limit.");
    }

    // Google Drive returns an HTML interstitial for large / non-shared files.
    const looksLikeHtml =
      contentType.includes("text/html") &&
      (target.includes("drive.google.com") || target.includes("docs.google.com"));
    if (looksLikeHtml) {
      throw new Error(
        "Couldn't fetch that Google Drive file directly. Make sure it's shared with 'Anyone with the link'.",
      );
    }

    const fileName = sanitizeName(
      filenameFromDisposition(res.headers.get("content-disposition")) ??
        filenameFromUrl(data.url),
    );
    const mimeType = contentType.split(";")[0].trim() || null;
    const path = `${crypto.randomUUID()}/${fileName}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: mimeType ?? undefined,
    });
    if (error) {
      throw new Error(`Couldn't store the file: ${error.message}`);
    }

    return {
      path,
      file_name: fileName,
      file_size: buffer.byteLength,
      mime_type: mimeType,
      original_ext: extOf(fileName) || null,
    };
  });
