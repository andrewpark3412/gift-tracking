import { supabase } from "./supabaseClient";
import { offlineQueue } from "./offlineQueue";

type SupabaseTable = "lists" | "people" | "gifts" | "household_invites" | "household_members";

export async function offlineInsert<T>(
  table: SupabaseTable,
  data: any
): Promise<{ data: T | null; error: any }> {
  if (!navigator.onLine) {
    // Queue the operation
    offlineQueue.add({
      type: "insert",
      table,
      data,
    });

    // Return optimistic response
    return {
      data: { ...data, id: `temp-${Date.now()}` } as T,
      error: null,
    };
  }

  const result = await supabase.from(table).insert(data).select("*").single();
  return result as { data: T | null; error: any };
}

export async function offlineUpdate<T>(
  table: SupabaseTable,
  id: string,
  updates: any
): Promise<{ data: T | null; error: any }> {
  if (!navigator.onLine) {
    // Queue the operation
    offlineQueue.add({
      type: "update",
      table,
      data: updates,
      recordId: id,
    });

    // Return optimistic response
    return {
      data: { ...updates, id } as T,
      error: null,
    };
  }

  const result = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  return result as { data: T | null; error: any };
}

export async function offlineDelete(
  table: SupabaseTable,
  id: string
): Promise<{ error: any }> {
  if (!navigator.onLine) {
    // Queue the operation
    offlineQueue.add({
      type: "delete",
      table,
      recordId: id,
    });

    // Return optimistic response
    return { error: null };
  }

  const result = await supabase.from(table).delete().eq("id", id);
  return result;
}
