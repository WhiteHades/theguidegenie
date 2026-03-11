import { createBrowserClient } from "@supabase/ssr";

export default defineNuxtPlugin({
  name: "supabase",
  parallel: false,
  setup() {
    const config = useRuntimeConfig();
    const supabaseUrl = config.public.supabaseUrl as string;
    const supabaseKey = config.public.supabaseAnonKey as string;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("[supabase] missing supabase url or anon key");

      return {
        provide: {
          supabase: null,
        },
      };
    }

    const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
      cookieOptions: {
        path: "/",
        sameSite: "lax",
      },
      isSingleton: true,
    });

    return {
      provide: {
        supabase,
      },
    };
  },
});
