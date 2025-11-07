// middleware to check if user is authenticated (but not necessarily a guide yet)
export default defineNuxtRouteMiddleware(async (to, from) => {
    const { user } = useAuth()

    if (!user.value) {
        return navigateTo('/guides/login')
    }
})

