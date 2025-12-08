<script setup lang="ts">
  // @ts-nocheck
  import { MenuIcon } from "lucide-vue-next";
  import { VisuallyHidden } from "radix-vue";

  const route = useRoute();
  const verticalScrollPosition = import.meta.server
    ? ref(0)
    : useWindowScroll().y;
  const { user } = useAuth();

  const isTop = computed(() => verticalScrollPosition.value < 10);

  const dashboardLink = computed(() => {
    if (!user.value) return "/guides/login";
    return user.value.user_type === "guide"
      ? "/guides/dashboard"
      : "/app/dashboard";
  });

  const loginLabel = computed(() => (user.value ? "dashboard" : "login"));

  const mobileMenuOpen = ref(false);
  const isMenuItemActive = (to) => route.fullPath.startsWith(to);

  watch(
    () => route.fullPath,
    () => (mobileMenuOpen.value = false),
  );

  const menuItems = [
    { label: "tours", to: "/tours" },
    { label: "become a guide", to: "/guides/signup" },
  ];
</script>

<template>
  <!-- floating pill navbar -->
  <nav class="fixed left-0 right-0 top-4 z-50 px-4">
    <div
      class="mx-auto flex max-w-5xl items-center justify-between rounded-full px-6 py-3 smooth"
      :class="
        isTop
          ? 'bg-white/10 backdrop-blur-xl border border-white/20'
          : 'bg-background/90 backdrop-blur-xl border border-border shadow-lg'
      "
    >
      <!-- logo -->
      <NuxtLink
        to="/"
        class="font-display text-lg font-bold"
        :class="isTop ? 'text-white' : 'text-foreground'"
      >
        the guide genie
      </NuxtLink>

      <!-- desktop nav -->
      <div class="hidden items-center gap-6 md:flex">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="text-sm smooth"
          :class="[
            isTop
              ? 'text-white/80 hover:text-white'
              : 'text-muted-foreground hover:text-foreground',
            isMenuItemActive(item.to) && 'font-medium',
          ]"
        >
          {{ item.label }}
        </NuxtLink>
      </div>

      <!-- actions -->
      <div class="flex items-center gap-3">
        <ColorModeToggle :class="isTop && 'text-white'" />

        <!-- mobile menu -->
        <Sheet v-model:open="mobileMenuOpen">
          <SheetTrigger asChild>
            <Button
              class="md:hidden"
              size="icon"
              variant="ghost"
              :class="isTop && 'text-white hover:bg-white/10'"
            >
              <MenuIcon class="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent class="w-[280px]" side="right">
            <VisuallyHidden>
              <DialogTitle>menu</DialogTitle>
              <DialogDescription>navigation</DialogDescription>
            </VisuallyHidden>
            <div class="mt-8 flex flex-col gap-4">
              <NuxtLink
                v-for="item in menuItems"
                :key="item.to"
                :to="item.to"
                class="text-lg"
              >
                {{ item.label }}
              </NuxtLink>
              <NuxtLink :to="dashboardLink" class="text-lg">{{
                loginLabel
              }}</NuxtLink>
            </div>
          </SheetContent>
        </Sheet>

        <!-- desktop login -->
        <Button
          class="hidden md:flex rounded-full px-4"
          size="sm"
          :variant="isTop ? 'secondary' : 'default'"
          :class="isTop && 'bg-white/20 text-white hover:bg-white/30 border-0'"
          asChild
        >
          <NuxtLink :to="dashboardLink">{{ loginLabel }}</NuxtLink>
        </Button>
      </div>
    </div>
  </nav>
</template>
