import type { AuthUser } from 'auth/lib/supabase'

export function useAuth() {
    const supabase = useSupabase()
    const user = useState<AuthUser | null>('auth-user', () => null)
    const loading = useState('auth-loading', () => true)

    async function fetchUser() {
        loading.value = true
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (!authUser) {
                user.value = null
                return
            }

            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            user.value = userData ? {
                id: userData.id,
                email: userData.email,
                user_type: userData.user_type,
                name: userData.name,
                phone: userData.phone,
            } : null
        } catch (error) {
            console.error('fetch user error:', error)
            user.value = null
        } finally {
            loading.value = false
        }
    }

    async function signin(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await fetchUser()
        return data.user
    }

    async function signup(email: string, password: string, name: string, user_type: 'tourist' | 'guide' = 'tourist') {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    user_type
                },
                emailRedirectTo: `${window.location.origin}/guides/dashboard`
            }
        })

        if (error) throw error
        if (!data.user) throw new Error('signup failed')

        // wait a bit for trigger to execute
        await new Promise(resolve => setTimeout(resolve, 500))
        await fetchUser()
        return data.user
    }

    async function signout() {
        await supabase.auth.signOut()
        user.value = null
    }

    async function checkIsGuide() {
        if (!user.value) return false
        const { data } = await supabase
            .from('guides')
            .select('id')
            .eq('user_id', user.value.id)
            .single()
        return !!data
    }

    const isAdmin = computed(() => user.value?.user_type === 'admin')

    return {
        user,
        loading,
        fetchUser,
        signin,
        signup,
        signout,
        checkIsGuide,
        isAdmin,
    }
}

