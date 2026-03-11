<script setup lang="ts">
import {
  CalendarIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  UserCircleIcon,
  ChevronDownIcon,
} from "lucide-vue-next";

const { user, guideProfile, signout } = useAuth();

const dashboardPath = computed(() => {
  if (guideProfile.value) {
    return "/guides/dashboard";
  }

  return "/app/dashboard";
});

const accountPath = computed(() => {
  if (guideProfile.value) {
    return "/guides/profile";
  }

  return "/app/account";
});

async function handleLogout() {
  await signout();
  await navigateTo("/");
}
</script>

<template>
  <DropdownMenu v-if="user">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="relative h-10 w-fit gap-2 rounded-full pl-2 pr-4 text-left hover:bg-muted">
        <Avatar class="size-8">
          <AvatarImage v-if="guideProfile?.avatar_url" :src="guideProfile.avatar_url" :alt="user.name" />
          <AvatarFallback class="bg-primary/10 text-xs font-medium text-primary">
            {{ user.name?.charAt(0).toUpperCase() || "U" }}
          </AvatarFallback>
        </Avatar>

        <div class="hidden text-left sm:flex sm:flex-col">
          <span class="text-xs font-semibold leading-none">{{ user.name }}</span>
          <span class="mt-1 text-[10px] leading-none text-muted-foreground">
            {{ guideProfile ? "guide" : "traveller" }}
          </span>
        </div>

        <ChevronDownIcon class="ml-1 size-3.5 text-muted-foreground opacity-50" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-56" align="end">
      <DropdownMenuLabel>
        {{ user.name }}
        <span class="mt-1 block text-xs font-normal text-muted-foreground">{{ user.email }}</span>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuItem @click="navigateTo(dashboardPath)">
        <LayoutDashboardIcon class="mr-2 size-4" />
        <span>dashboard</span>
      </DropdownMenuItem>

      <DropdownMenuItem @click="navigateTo(accountPath)">
        <UserCircleIcon class="mr-2 size-4" />
        <span>{{ guideProfile ? "profile" : "account" }}</span>
      </DropdownMenuItem>

      <DropdownMenuItem v-if="!guideProfile" @click="navigateTo('/app/dashboard')">
        <CalendarIcon class="mr-2 size-4" />
        <span>my bookings</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogout">
        <LogOutIcon class="mr-2 size-4" />
        <span>log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
