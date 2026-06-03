import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DocumentRow = Tables<"documents">;
export type DocumentTypeRow = Tables<"document_types">;
export type FolderRow = Tables<"folders">;

export const BUCKET = "documents";

/** Field labels (Estonian terms the team uses). */
export const FIELD_LABELS = {
  tuup: "Tüüp (type)",
  tellimuse_kinnitus: "Tellimuse kinnitus (order confirmation)",
  objekt: "Objekt (object / project)",
  materjal: "Materjal (material)",
  supplier: "Supplier",
  doc_date: "Date",
} as const;

/** Display a document's system number as a zero-padded code, e.g. 0001. */
export function formatDocNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return String(n).padStart(4, "0");
}

export function extOf(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : "";
}

export function isPreviewable(mime: string | null, ext: string | null): boolean {
  const m = (mime ?? "").toLowerCase();
  const e = (ext ?? "").toLowerCase();
  if (m.startsWith("image/") || m === "application/pdf") return true;
  return ["pdf", "png", "jpg", "jpeg", "gif", "webp", "svg", "txt"].includes(e);
}

export function formatBytes(bytes: number | null): string {
  if (!bytes && bytes !== 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---------------- Roles ----------------

/** True if the current signed-in user has the admin role. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return false;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

// ---------------- Documents ----------------


export async function listDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data ?? [];
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadFile(file: File, prefix = ""): Promise<{ path: string }> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${prefix}${crypto.randomUUID()}/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return { path };
}

/** Accepted preview-image types for the optional screenshot/thumbnail. */
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export type DocumentMetadata = Omit<
  TablesInsert<"documents">,
  "id" | "created_at" | "updated_at"
>;

export async function createDocument(payload: DocumentMetadata): Promise<DocumentRow> {
  const { data: userData } = await supabase.auth.getUser();
  const u = userData.user;
  const uploaderName =
    (u?.user_metadata?.full_name as string | undefined) ||
    (u?.user_metadata?.name as string | undefined) ||
    u?.email ||
    null;
  const { data, error } = await supabase
    .from("documents")
    .insert({ ...payload, uploaded_by: u?.id ?? null, uploaded_by_name: uploaderName })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocument(
  id: string,
  payload: Partial<DocumentMetadata>,
): Promise<DocumentRow> {
  const { data, error } = await supabase
    .from("documents")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(doc: DocumentRow): Promise<void> {
  const paths = [doc.file_path, doc.thumbnail_path].filter(Boolean) as string[];
  if (paths.length) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw error;
}

export async function getSignedUrl(path: string, download = false): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60, { download });
  if (error) throw error;
  return data.signedUrl;
}

/** Private, reusable share link to the stored file, valid for 24 hours. */
export async function getShareUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24);
  if (error) throw error;
  return data.signedUrl;
}

// ---------------- Document types ----------------

export async function listDocumentTypes(): Promise<DocumentTypeRow[]> {
  const { data, error } = await supabase
    .from("document_types")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function ensureDocumentType(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  // Insert if not present; ignore unique-violation conflicts.
  const { error } = await supabase
    .from("document_types")
    .insert({ name: trimmed });
  if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
    // Non-conflict errors are non-fatal for the upload flow; log only.
    console.warn("Could not add document type:", error.message);
  }
}

/** Distinct non-empty values for a given column, for filter/suggestion lists. */
export function distinctValues(docs: DocumentRow[], key: keyof DocumentRow): string[] {
  const set = new Set<string>();
  for (const d of docs) {
    const v = d[key];
    if (typeof v === "string" && v.trim()) set.add(v.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// ---------------- Folders ----------------

export async function listFolders(): Promise<FolderRow[]> {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createFolder(name: string, parentId: string | null = null): Promise<FolderRow> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Folder name is required.");
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("folders")
    .insert({ name: trimmed, parent_id: parentId, created_by: userData.user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function renameFolder(id: string, name: string): Promise<FolderRow> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Folder name is required.");
  const { data, error } = await supabase
    .from("folders")
    .update({ name: trimmed })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Admin-only at the database level. Documents in the folder fall back to "Unfiled". */
export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

export async function moveDocumentToFolder(
  documentId: string,
  folderId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({ folder_id: folderId })
    .eq("id", documentId);
  if (error) throw error;
}

/** Folders sorted hierarchically, each with a depth and a full "Parent / Child" path label. */
export function folderOptions(
  folders: FolderRow[],
): Array<{ id: string; name: string; depth: number; path: string }> {
  const childrenOf = new Map<string | null, FolderRow[]>();
  for (const f of folders) {
    const key = f.parent_id ?? null;
    const arr = childrenOf.get(key) ?? [];
    arr.push(f);
    childrenOf.set(key, arr);
  }
  for (const arr of childrenOf.values()) arr.sort((a, b) => a.name.localeCompare(b.name));

  const out: Array<{ id: string; name: string; depth: number; path: string }> = [];
  const walk = (parentId: string | null, depth: number, prefix: string) => {
    for (const f of childrenOf.get(parentId) ?? []) {
      const path = prefix ? `${prefix} / ${f.name}` : f.name;
      out.push({ id: f.id, name: f.name, depth, path });
      walk(f.id, depth + 1, path);
    }
  };
  walk(null, 0, "");
  return out;
}


