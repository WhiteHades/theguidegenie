import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin({
    name: 'supabase',
    parallel: false,
    setup() {
        const config = useRuntimeConfig()

        const supabaseUrl = config.public.supabaseUrl as string
        const supabaseKey = config.public.supabaseAnonKey as string

        const supabase = createClient(supabaseUrl, supabaseKey)

        return {
            provide: {
                supabase,
            },
        }
    }
})

