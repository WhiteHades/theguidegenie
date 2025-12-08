<script setup lang="ts">
// oauth callback handler - processes tokens from social providers
import { toast } from "@/modules/ui/components/toast"

definePageMeta({ layout: "saas-auth" })

const supabase = useSupabase()
const { fetchUser, checkIsGuide } = useAuth()

const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    // supabase handles the token exchange automatically from URL hash
    const { data, error: authError } = await supabase.auth.getSession()
    
    if (authError) throw authError
    
    if (!data.session) {
      throw new Error("no session found - please try again")
    }

    // fetch user profile
    await fetchUser()
    
    toast({ title: "welcome!", variant: "success" })

    // check user type and redirect appropriately
    const isGuide = await checkIsGuide()
    
    if (isGuide) {
      navigateTo("/guides/dashboard")
    } else {
      navigateTo("/tours")
    }
  } catch (e: any) {
    console.error("oauth callback error:", e)
    error.value = e.message || "authentication failed"
    toast({ title: "login failed", description: error.value, variant: "error" })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <!-- loading -->
    <template v-if="loading">
      <div class="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p class="mt-4 text-muted-foreground">completing sign in...</p>
    </template>

    <!-- error -->
    <template v-else-if="error">
      <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <span class="text-2xl">😕</span>
      </div>
      <h2 class="font-display text-xl font-bold">something went wrong</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ error }}</p>
      <div class="mt-6 flex gap-3">
        <Button variant="outline" @click="navigateTo('/auth/tourist/login')">
          try again
        </Button>
        <Button @click="navigateTo('/tours')">
          browse tours
        </Button>
      </div>
    </template>
  </div>
</template>

