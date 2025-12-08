import type { SupabaseClient } from '@supabase/supabase-js'

export function useSupabase(): SupabaseClient | null {
    const nuxtApp = useNuxtApp()
    return nuxtApp.$supabase as SupabaseClient | null
}
