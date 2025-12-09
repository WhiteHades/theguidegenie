// middleware to check if tourist user is authenticated
// used for routes that require a logged-in tourist (bookings, favorites, etc.)
export default defineNuxtRouteMiddleware(async (to, from) => {
    const { user, initialized } = useAuth()

    // wait for auth to initialize on client
    if (import.meta.client && !initialized.value) {
        await new Promise<void>(resolve => {
            const unwatch = watch(initialized, (val) => {
                if (val) {
                    unwatch()
                    resolve()
                }
            }, { immediate: true })
            setTimeout(() => {
                unwatch()
                resolve()
            }, 5000)
        })
    }

    if (!user.value) {
        return navigateTo('/auth/tourist/login', {
            replace: true,
            query: { redirect: to.fullPath }
        })
    }
})

