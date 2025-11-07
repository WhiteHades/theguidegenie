// initialize auth state on client
export default defineNuxtPlugin(async () => {
    const { fetchUser } = useAuth()

    // fetch current user on app load
    await fetchUser()
})

