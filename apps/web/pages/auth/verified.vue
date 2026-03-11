<script setup lang="ts">
const route = useRoute();

await navigateTo(
  {
    path: "/auth/callback",
    query: route.query,
    hash: route.hash,
  },
  { replace: true },
);
</script>
