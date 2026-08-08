import type { SavePoint, ReconstructedState, CaptureSource, AuthUser } from "./types";

// Maps a raw Supabase row (snake_case) into the SavePoint API shape (camelCase).
export function rowToSavePoint(row: Record<string, unknown>): SavePoint {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    source: row.source as CaptureSource,
    userNote: (row.user_note as string | null) ?? null,
    activeContext: (row.active_context as SavePoint["activeContext"]) ?? {},
    openTabs: (row.open_tabs as SavePoint["openTabs"]) ?? [],
    workspaceContext:
      (row.workspace_context as SavePoint["workspaceContext"]) ?? {},
    reconstruction: (row.reconstruction as ReconstructedState | null) ?? null,
    corrections: (row.corrections as SavePoint["corrections"]) ?? [],
    orientingAnswer: (row.orienting_answer as string | null) ?? null,
    restored: row.restored === true,
    restoredAt: (row.restored_at as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

// Maps a raw Supabase users row into the public AuthUser shape — never
// includes password_hash.
export function rowToAuthUser(row: Record<string, unknown>): AuthUser {
  return {
    id: String(row.id),
    email: String(row.email),
    fullName: String(row.full_name),
    username: String(row.username),
  };
}
