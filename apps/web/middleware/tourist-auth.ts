// middleware to check if tourist user is authenticated
// used for routes that require a logged-in tourist (bookings, favorites, etc.)
export default defineNuxtRouteMiddleware(async (to, from) => {
    const { user, initialized } = useAuth()

    // wait for auth to initialize on client
    if (import.meta.client && !initialized.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (!user.value) {
        return navigateTo('/auth/tourist/login', {
            replace: true,
            query: { redirect: to.fullPath }
        })
    }
})

