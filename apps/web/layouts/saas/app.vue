<script setup lang="ts">
await callOnce(() => useAuth().fetchUser());

const route = useRoute();
const auth = useAuth();

if (!auth.user.value) {
  await navigateTo("/auth/tourist/login", {
    replace: true,
    query: { redirect: route.fullPath },
  });
}
</script>

<template>
  <main class="min-h-screen bg-background pt-24">
    <MarketingNavBar />
    <slot />
  </main>
</template>
