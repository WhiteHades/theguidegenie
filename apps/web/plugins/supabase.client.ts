import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin({
    name: 'supabase',
    parallel: false,
    setup() {
        const config = useRuntimeConfig()

        const supabaseUrl = config.public.supabaseUrl as string
        const supabaseKey = config.public.supabaseAnonKey as string

        if (!supabaseUrl || !supabaseKey) {
            console.warn('[supabase] Missing supabaseUrl or supabaseAnonKey')
            return {
                provide: {
                    supabase: null,
                },
            }
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: import.meta.client,
                autoRefreshToken: import.meta.client,
                detectSessionInUrl: import.meta.client,
            }
        })

        return {
            provide: {
                supabase,
            },
        }
    }
})
