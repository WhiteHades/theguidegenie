// initialize auth state on client
export default defineNuxtPlugin({
    name: 'auth',
    dependsOn: ['supabase'],
    parallel: false,
    async setup() {
        const { fetchUser } = useAuth()

        // fetch current user on app load
        await fetchUser()
    }
})

