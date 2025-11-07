// middleware to protect guide routes
export default defineNuxtRouteMiddleware(async (to, from) => {
    const { user, checkIsGuide } = useAuth()

    // check if user is logged in
    if (!user.value) {
        return navigateTo('/guides/login')
    }

    // check if user has guide profile
    const isGuide = await checkIsGuide()
    if (!isGuide) {
        return navigateTo('/guides/onboarding')
    }
})

