<template>
  <footer class="border-t border-border bg-card py-16">
    <div class="container">
      <div class="grid gap-12 md:grid-cols-4">
        <!-- brand -->
        <div class="md:col-span-2">
          <span class="font-display text-xl font-bold">the guide genie</span>
          <p class="mt-4 max-w-sm text-sm text-muted-foreground">
            discover budapest through the eyes of passionate locals. authentic
            tours, hidden gems, unforgettable memories.
          </p>
        </div>

        <!-- explore -->
        <div>
          <h4 class="small-caps mb-4 font-semibold">explore</h4>
          <div class="flex flex-col gap-2 text-sm text-muted-foreground">
            <NuxtLink to="/tours" class="hover:text-foreground smooth"
              >all tours</NuxtLink
            >
            <NuxtLink to="/guides/signup" class="hover:text-foreground smooth"
              >become a guide</NuxtLink
            >
          </div>
        </div>

        <!-- legal -->
        <div>
          <h4 class="small-caps mb-4 font-semibold">legal</h4>
          <div class="flex flex-col gap-2 text-sm text-muted-foreground">
            <NuxtLink to="/legal/privacy" class="hover:text-foreground smooth"
              >privacy policy</NuxtLink
            >
            <NuxtLink to="/legal/terms" class="hover:text-foreground smooth"
              >terms of service</NuxtLink
            >
          </div>
        </div>
      </div>

      <div
        class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row"
      >
        <p>© {{ new Date().getFullYear() }} the guide genie. all rights reserved.</p>
        <ColorModeToggle />
      </div>
    </div>
  </footer>
</template>
