export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();

  if (!auth.initialized.value) {
    await auth.fetchUser();
  }

  if (!auth.user.value) {
    return navigateTo("/auth/tourist/login", {
      replace: true,
      query: { redirect: to.fullPath },
    });
  }

  if (await auth.checkIsGuide()) {
    return navigateTo("/guides/dashboard", { replace: true });
  }
});
