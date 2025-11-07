// supabase auth wrapper
import { createSupabaseClient, createSupabaseServerClient, type User, type UserType } from 'database'

export interface AuthUser {
    id: string
    email: string
    user_type: UserType
    name: string
    phone: string | null
}

// client side auth (browser)
export function createAuthClient(url: string, anonKey: string) {
    return createSupabaseClient(url, anonKey)
}

// server side auth (api routes)
export function createAuthServerClient(url: string, serviceRoleKey: string) {
    return createSupabaseServerClient(url, serviceRoleKey)
}

// get current user from supabase auth + our users table
export async function getCurrentUser(supabase: ReturnType<typeof createAuthClient>): Promise<AuthUser | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return null

    // fetch from our users table
    const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

    if (error || !userData) return null

    return {
        id: userData.id,
        email: userData.email,
        user_type: userData.user_type,
        name: userData.name,
        phone: userData.phone,
    }
}

// signup new user
export async function signupUser(
    supabase: ReturnType<typeof createAuthServerClient>,
    email: string,
    password: string,
    name: string,
    user_type: UserType = 'tourist'
) {
    // create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto confirm for now
    })

    if (authError || !authData.user) {
        throw new Error(authError?.message || 'failed to create user')
    }

    // create user record in our table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            email,
            user_type,
            name,
        })
        .select()
        .single()

    if (userError) {
        // rollback auth user if our insert fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw new Error(userError.message)
    }

    return userData
}

// signin with email/password
export async function signinUser(
    supabase: ReturnType<typeof createAuthClient>,
    email: string,
    password: string
) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) throw new Error(error.message)

    return data.user
}

// signout
export async function signoutUser(supabase: ReturnType<typeof createAuthClient>) {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
}

// check if user is a guide
export async function isGuide(supabase: ReturnType<typeof createAuthClient>, userId: string): Promise<boolean> {
    const { data } = await supabase
        .from('guides')
        .select('id')
        .eq('user_id', userId)
        .single()

    return !!data
}

// check if user is admin
export async function isAdmin(supabase: ReturnType<typeof createAuthClient>, userId: string): Promise<boolean> {
    const { data } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .single()

    return data?.user_type === 'admin'
}

