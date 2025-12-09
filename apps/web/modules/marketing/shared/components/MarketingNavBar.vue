<script setup lang="ts">
  import { MenuIcon, XIcon, SunIcon, MoonIcon } from "lucide-vue-next";

  const route = useRoute();
  const colorMode = useColorMode();
  
  const verticalScrollPosition = import.meta.server
    ? ref(0)
    : useWindowScroll().y;

  const { user } = useAuth();

  const isTop = computed(() => verticalScrollPosition.value < 10);

  const dashboardLink = computed(() => {
    if (!user.value) return "/auth/tourist/login";
    return user.value.user_type === "guide"
      ? "/guides/dashboard"
      : "/app/dashboard";
  });

  const mobileMenuOpen = ref(false);
  const authDialogOpen = ref(false);
  const isMenuItemActive = (to: string) => route.fullPath.startsWith(to);

  // Close mobile menu on route change
  watch(
    () => route.fullPath,
    () => (mobileMenuOpen.value = false),
  );

  // Toggle color mode
  function toggleColorMode() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  }

  const menuItems = computed(() => {
    if (!user.value) {
      return [
        { label: "tours", to: "/tours" },
        { label: "become a guide", to: "/guides/signup" },
      ];
    }
    
    if (user.value.user_type === 'guide') {
      return [
        { label: "dashboard", to: "/guides/dashboard" },
        { label: "my tours", to: "/guides/tours" },
      ];
    }
    
    return [
       { label: "browse tours", to: "/tours" },
    ];
  });
</script>

<template>
  <!-- floating pill navbar -->
  <nav class="fixed left-0 right-0 top-2 z-50 px-2 sm:top-4 sm:px-4">
    <div
      class="mx-auto flex max-w-5xl items-center justify-between rounded-full px-4 py-2.5 smooth sm:px-6 sm:py-3"
      :class="
        isTop
          ? 'bg-white/10 backdrop-blur-xl border border-white/20'
          : 'bg-background/90 backdrop-blur-xl border border-border shadow-lg'
      "
    >
      <!-- logo -->
      <NuxtLink
        to="/"
        class="font-display text-base font-bold sm:text-lg"
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
      <div class="flex items-center gap-1 sm:gap-2">
        <!-- Theme toggle - simple button that always works -->
        <ClientOnly>
          <button
            type="button"
            class="flex size-8 sm:size-9 items-center justify-center rounded-full transition-colors"
            :class="isTop ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'"
            @click="toggleColorMode"
            aria-label="Toggle color mode"
          >
            <SunIcon v-if="colorMode.value === 'dark'" class="size-4 sm:size-5" />
            <MoonIcon v-else class="size-4 sm:size-5" />
          </button>
          <template #fallback>
            <div class="size-8 sm:size-9" />
          </template>
        </ClientOnly>

        <!-- Mobile menu button -->
        <button
          type="button"
          class="flex size-8 sm:size-9 items-center justify-center rounded-full transition-colors md:hidden"
          :class="isTop ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="Toggle menu"
        >
          <MenuIcon v-if="!mobileMenuOpen" class="size-5" />
          <XIcon v-else class="size-5" />
        </button>

        <!-- desktop auth buttons -->
        <ClientOnly>
          <template v-if="user">
            <UserMenuDropdown />
          </template>
          <template v-else>
            <Button
              class="hidden md:flex rounded-full px-4"
              size="sm"
              variant="ghost"
              :class="isTop ? 'text-white hover:bg-white/10' : ''"
              asChild
            >
              <NuxtLink to="/auth/tourist/login">login</NuxtLink>
            </Button>
            <Button
              class="hidden md:flex rounded-full px-4"
              size="sm"
              :variant="isTop ? 'secondary' : 'default'"
              :class="isTop && 'bg-white text-primary hover:bg-white/90 border-0'"
              @click="authDialogOpen = true"
            >
              sign up
            </Button>
          </template>
        </ClientOnly>
      </div>
    </div>
    
    <!-- Mobile menu dropdown (simple, no Sheet component) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 -translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="mobileMenuOpen"
        class="mx-auto mt-2 max-w-5xl rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur-xl md:hidden"
      >
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="rounded-lg px-4 py-2.5 text-base font-medium transition-colors hover:bg-muted"
            :class="isMenuItemActive(item.to) && 'bg-muted'"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
          
          <div class="my-2 h-px bg-border" />
          
          <template v-if="user">
            <NuxtLink
              :to="dashboardLink"
              class="rounded-lg px-4 py-2.5 text-base font-medium transition-colors hover:bg-muted"
              @click="mobileMenuOpen = false"
            >
              dashboard
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink
              to="/auth/tourist/login"
              class="rounded-lg px-4 py-2.5 text-base font-medium transition-colors hover:bg-muted"
              @click="mobileMenuOpen = false"
            >
              login
            </NuxtLink>
            <Button 
              class="mt-2 w-full" 
              @click="authDialogOpen = true; mobileMenuOpen = false"
            >
              sign up
            </Button>
          </template>
        </div>
      </div>
    </Transition>
  </nav>
  
  <!-- Auth choice dialog -->
  <AuthChoiceDialog v-model:open="authDialogOpen" />
</template>
