// middleware to check if user is authenticated (but not necessarily a guide yet)
// used for guide onboarding route
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
        return navigateTo('/guides/login', {
            replace: true,
            query: { redirect: to.fullPath }
        })
    }
})
