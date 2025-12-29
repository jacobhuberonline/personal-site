import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasConfig = Boolean(url && anon);

export const isSupabaseConfigured = hasConfig;
export const supabase: SupabaseClient | null = hasConfig ? createClient(url as string, anon as string) : null;
