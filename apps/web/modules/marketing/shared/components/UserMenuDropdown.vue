<script setup lang="ts">
  import {
    UserIcon,
    LogOutIcon,
    LayoutDashboardIcon,
    SettingsIcon,
    ChevronDownIcon,
  } from "lucide-vue-next";

  const { user, signout, isGuide } = useAuth();
  const localePath = useLocalePath();
  const { t } = useTranslations();

  const handleLogout = async () => {
    await signout();
    navigateTo(localePath("/"));
  };

  const dashboardPath = computed(() => {
     if (user.value?.user_type === 'guide') return '/guides/dashboard';
     return '/app/dashboard';
  });
</script>

<template>
  <DropdownMenu v-if="user">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="relative h-10 w-fit gap-2 rounded-full pl-2 pr-4 hover:bg-muted text-left">
        <Avatar class="size-8">
          <AvatarImage
            v-if="user.user_type === 'guide'" 
            :src="null" 
            alt="Guide"
          />
          <AvatarFallback class="bg-primary/10 text-primary font-medium text-xs">
            {{ user.name?.charAt(0).toUpperCase() || 'U' }}
          </AvatarFallback>
        </Avatar>
        
        <div class="flex flex-col text-left hidden sm:flex">
          <span class="text-xs font-semibold leading-none">{{ user.name }}</span>
          <span class="text-[10px] text-muted-foreground leading-none mt-1 capitalize">{{ user.user_type }}</span>
        </div>
        
        <ChevronDownIcon class="size-3.5 text-muted-foreground opacity-50 ml-1" />
      </Button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent class="w-56" align="end">
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <DropdownMenuItem @click="navigateTo(localePath(dashboardPath))">
        <LayoutDashboardIcon class="mr-2 size-4" />
        <span>Dashboard</span>
      </DropdownMenuItem>
      
      <DropdownMenuItem>
        <UserIcon class="mr-2 size-4" />
        <span>Profile</span>
      </DropdownMenuItem>
      
      <DropdownMenuItem>
        <SettingsIcon class="mr-2 size-4" />
        <span>Settings</span>
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem @click="handleLogout" class="text-destructive focus:text-destructive">
        <LogOutIcon class="mr-2 size-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
