// the guide genie auth composable - handles all authentication logic

type OAuthProvider = 'google' | 'apple' | 'github'

interface AuthUser {
  id: string
  email: string
  user_type: 'tourist' | 'guide' | 'admin'
  name: string
  phone: string | null
}

interface SignupOptions {
  email: string
  password: string
  name: string
  userType?: 'tourist' | 'guide'
}

interface GuideProfile {
  id: string
  user_id: string
  name: string
  city: string
  contact_email: string
  phone: string | null
  bio: string | null
  avatar_url: string | null
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const guideProfile = useState<GuideProfile | null>('guide-profile', () => null)
  const loading = useState('auth-loading', () => true)
  const initialized = useState('auth-initialized', () => false)

  // helper to get supabase client (only available on client)
  function getSupabase() {
    const client = useSupabase()
    if (!client) throw new Error('supabase client not available')
    return client
  }

  // fetch current user from db
  async function fetchUser(): Promise<AuthUser | null> {
    if (import.meta.server) return null
    
    const supabase = getSupabase()
    loading.value = true
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        user.value = null
        guideProfile.value = null
        return null
      }

      // fetch user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        // user exists in auth but not in users table - create entry
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'user',
            user_type: authUser.user_metadata?.user_type || 'tourist',
            phone: null,
          })
          .select()
          .single()

        if (insertError) {
          console.error('failed to create user record:', insertError)
          user.value = null
          return null
        }

        user.value = {
          id: newUser.id,
          email: newUser.email,
          user_type: newUser.user_type,
          name: newUser.name,
          phone: newUser.phone,
        }
      } else {
        user.value = {
          id: userData.id,
          email: userData.email,
          user_type: userData.user_type,
          name: userData.name,
          phone: userData.phone,
        }
      }

      // if user is a guide, fetch guide profile
      if (user.value?.user_type === 'guide') {
        await fetchGuideProfile()
      }

      return user.value
    } catch (error) {
      console.error('fetch user error:', error)
      user.value = null
      guideProfile.value = null
      return null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  // fetch guide profile
  async function fetchGuideProfile(): Promise<GuideProfile | null> {
    if (import.meta.server || !user.value) return null

    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('user_id', user.value.id)
        .single()

      if (error) {
        guideProfile.value = null
        return null
      }

      guideProfile.value = data
      return data
    } catch {
      guideProfile.value = null
      return null
    }
  }

  // sign in with email/password
  async function signin(email: string, password: string): Promise<AuthUser> {
    // validate inputs
    if (!email?.trim()) throw new Error('email is required')
    if (!password) throw new Error('password is required')

    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      // provide user-friendly error messages
      if (error.message.includes('Invalid login')) {
        throw new Error('invalid email or password')
      }
      throw new Error(error.message)
    }

    if (!data.user) throw new Error('signin failed - please try again')

    const authUser = await fetchUser()
    if (!authUser) throw new Error('failed to load user profile')

    return authUser
  }

  // sign up new user
  async function signup(options: SignupOptions): Promise<AuthUser> {
    const { email, password, name, userType = 'tourist' } = options

    // validate inputs
    if (!email?.trim()) throw new Error('email is required')
    if (!password) throw new Error('password is required')
    if (password.length < 8) throw new Error('password must be at least 8 characters')
    if (!name?.trim()) throw new Error('name is required')
    if (name.trim().length < 2) throw new Error('name must be at least 2 characters')

    // check for common password patterns
    const weakPatterns = ['password', '12345678', 'qwerty', 'letmein']
    if (weakPatterns.some(p => password.toLowerCase().includes(p))) {
      throw new Error('please choose a stronger password')
    }

    const redirectPath = userType === 'guide' ? '/guides/onboarding' : '/tours'

    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          user_type: userType,
        },
        emailRedirectTo: `${window.location.origin}/auth/verified`,
      },
    })

    if (error) {
      if (
        error.message.includes('already registered') || 
        error.message.includes('User already exists') ||
        error.status === 422
      ) {
        throw new Error('this email is already registered. please log in instead.')
      }
      throw new Error(error.message)
    }

    if (!data.user) throw new Error('signup failed - please try again')

    // wait for db trigger to create user record with retry
    let authUser: AuthUser | null = null
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 500))
      authUser = await fetchUser()
      if (authUser) break
    }
    
    if (!authUser) {
      // db trigger might be slow, but auth user is created. return basic structure.
      return {
        id: data.user.id,
        email: data.user.email!,
        user_type: options.userType || 'tourist',
        name: options.name,
        phone: null,
      }
    }

    return authUser
  }

  // sign out
  async function signout(): Promise<void> {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    user.value = null
    guideProfile.value = null
  }

  // request password reset
  async function requestPasswordReset(email: string): Promise<void> {
    if (!email?.trim()) throw new Error('email is required')

    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    )

    if (error) throw new Error(error.message)
  }

  // update password (when user has reset token)
  async function updatePassword(newPassword: string): Promise<void> {
    if (!newPassword) throw new Error('password is required')
    if (newPassword.length < 8) throw new Error('password must be at least 8 characters')

    const supabase = getSupabase()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) throw new Error(error.message)
  }

  // check if user has guide profile
  async function checkIsGuide(): Promise<boolean> {
    if (!user.value) return false

    if (guideProfile.value) return true

    const profile = await fetchGuideProfile()
    return !!profile
  }

  // update user profile
  async function updateProfile(updates: { name?: string; phone?: string }): Promise<void> {
    if (!user.value) throw new Error('not authenticated')

    const supabase = getSupabase()
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.value.id)

    if (error) throw new Error(error.message)

    // refresh user data
    await fetchUser()
  }

  // sign in with oauth provider (google, apple, etc)
  async function signinWithOAuth(provider: OAuthProvider, redirectTo?: string): Promise<void> {
    const defaultRedirect = `${window.location.origin}/auth/callback`
    
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || defaultRedirect,
        queryParams: {
          // request offline access for refresh tokens
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) throw new Error(error.message)
    
    // oauth redirects to provider, no return value needed
  }

  // computed helpers
  const isAuthenticated = computed(() => !!user.value)
  const isGuide = computed(() => user.value?.user_type === 'guide' && !!guideProfile.value)
  const isTourist = computed(() => user.value?.user_type === 'tourist')
  const isAdmin = computed(() => user.value?.user_type === 'admin')

  return {
    user,
    guideProfile,
    loading,
    initialized,
    fetchUser,
    fetchGuideProfile,
    signin,
    signup,
    signinWithOAuth,
    signout,
    requestPasswordReset,
    updatePassword,
    checkIsGuide,
    updateProfile,
    isAuthenticated,
    isGuide,
    isTourist,
    isAdmin,
  }
}
