// initialize auth state on client and listen for changes
export default defineNuxtPlugin({
    name: 'auth',
    dependsOn: ['supabase'],
    parallel: false,
    async setup() {
        const { fetchUser } = useAuth()
        const supabase = useSupabase()

        // fetch current user on app load
        await fetchUser()

        // listen for auth state changes (sign in, sign out, token refresh)
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await fetchUser()
            } else if (event === 'SIGNED_OUT') {
                // clear user state - handled in signout() but this catches browser tab sync
                const user = useState('auth-user')
                const guideProfile = useState('guide-profile')
                user.value = null
                guideProfile.value = null
            }
        })
    }
})

