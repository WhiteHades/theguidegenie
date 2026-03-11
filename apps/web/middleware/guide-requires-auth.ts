export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();

  if (!auth.initialized.value) {
    await auth.fetchUser();
  }

  if (!auth.user.value) {
    return navigateTo("/guides/login", {
      replace: true,
      query: { redirect: to.fullPath },
    });
  }
});
