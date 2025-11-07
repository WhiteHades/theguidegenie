export function useSupabase() {
    const { $supabase } = useNuxtApp()
    return $supabase
}

