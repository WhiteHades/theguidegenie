export default defineNuxtPlugin({
  name: "auth",
  dependsOn: ["supabase"],
  parallel: false,
  async setup() {
    const auth = useAuth();
    const supabase = useSupabase();

    if (!supabase) {
      console.warn("[auth] supabase client not available");
      auth.initialized.value = true;
      return;
    }

    await auth.fetchUser();

    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        auth.user.value = null;
        auth.guideProfile.value = null;
        auth.initialized.value = true;
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        await auth.fetchUser();
      }
    });
  },
});
