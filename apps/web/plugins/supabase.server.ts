import { createServerSupabaseClient } from "~/server/utils/supabase";

export default defineNuxtPlugin(() => {
  const event = useRequestEvent();

  if (!event) {
    return {
      provide: {
        supabase: null,
      },
    };
  }

  return {
    provide: {
      supabase: createServerSupabaseClient(event),
    },
  };
});
