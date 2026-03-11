import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import { parseCookies, setCookie } from "h3";

function getSupabaseConfig() {
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("supabase env vars are missing");
  }

  return {
    url,
    anonKey,
  };
}

export function createServerSupabaseClient(event: H3Event): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return Object.entries(parseCookies(event)).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookies) {
        for (const cookie of cookies) {
          setCookie(event, cookie.name, cookie.value, {
            path: "/",
            ...cookie.options,
          });
        }
      },
    },
  });
}
