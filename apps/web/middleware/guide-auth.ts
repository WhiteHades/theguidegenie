// middleware to protect guide dashboard and management routes
// ensures user is logged in AND has a guide profile
export default defineNuxtRouteMiddleware(async (to, from) => {
    const { user, guideProfile, checkIsGuide, initialized, loading } = useAuth()

    // wait for auth to initialize on client - properly await with watcher
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

    // not logged in - redirect to guide login
    if (!user.value) {
        return navigateTo('/guides/login', { 
            replace: true,
            query: { redirect: to.fullPath }
        })
    }

    // check if user has guide profile
    if (!guideProfile.value) {
        const isGuide = await checkIsGuide()
        if (!isGuide) {
            // logged in but no guide profile - redirect to onboarding
            if (to.path !== '/guides/onboarding') {
                return navigateTo('/guides/onboarding', { replace: true })
            }
        }
    }
})
