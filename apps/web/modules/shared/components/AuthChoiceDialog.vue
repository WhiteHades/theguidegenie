<script setup lang="ts">
  import { UserIcon, MapIcon } from 'lucide-vue-next'
  
  const open = defineModel<boolean>('open', { default: false })
  
  const options = [
    {
      type: 'tourist',
      title: 'i want to explore',
      description: 'find and book amazing local tours',
      icon: UserIcon,
      href: '/auth/tourist/signup',
    },
    {
      type: 'guide',
      title: 'i\'m a local guide',
      description: 'share your city with travelers',
      icon: MapIcon,
      href: '/guides/signup',
    },
  ]
</script>

<template>
  <ClientOnly>
    <Dialog v-model:open="open">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-center text-xl font-bold">
            join the guide genie
          </DialogTitle>
          <DialogDescription class="text-center">
            how would you like to get started?
          </DialogDescription>
        </DialogHeader>
        
        <div class="mt-4 grid gap-4">
          <NuxtLink
            v-for="option in options"
            :key="option.type"
            :to="option.href"
            class="group flex items-center gap-4 rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:shadow-md"
            @click="open = false"
          >
            <div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
              <component :is="option.icon" class="size-6" />
            </div>
            <div>
              <h3 class="font-semibold">{{ option.title }}</h3>
              <p class="text-sm text-muted-foreground">{{ option.description }}</p>
            </div>
          </NuxtLink>
        </div>
        
        <div class="mt-4 text-center text-sm text-muted-foreground">
          already have an account?
          <NuxtLink to="/auth/tourist/login" class="font-medium text-primary hover:underline" @click="open = false">
            sign in
          </NuxtLink>
        </div>
      </DialogContent>
    </Dialog>
  </ClientOnly>
</template>
