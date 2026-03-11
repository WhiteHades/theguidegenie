<script setup lang="ts">
// oauth callback handler - processes tokens from social providers
import { toast } from "@/modules/ui/components/toast"

definePageMeta({ layout: "saas-auth" })

const supabase = useSupabase()
const route = useRoute()
const { fetchUser, checkIsGuide } = useAuth()

const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    if (!supabase) {
      throw new Error("supabase client not available")
    }

    const code = typeof route.query.code === "string" ? route.query.code : undefined
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) 
throw exchangeError
    }

    const { data, error: authError } = await supabase.auth.getSession()
    
    if (authError) 
throw authError
    
    if (!data.session) {
      throw new Error("no session found - please try again")
    }

    const next = typeof route.query.next === "string" ? route.query.next : null

    if (route.query.mode === "reset") {
      navigateTo({
        path: "/auth/reset-password",
        query: next ? { next: resolveSafeRedirect(next, "/app/dashboard") } : undefined,
      }, { replace: true })
      return
    }

    const authUser = await fetchUser()
    
    toast({ title: "welcome!", variant: "success" })

    const isGuide = await checkIsGuide()
    const requestedIntent = typeof route.query.intent === "string" ? route.query.intent : null
    
    if (isGuide) {
      navigateTo(resolveSafeRedirect(next, "/guides/dashboard"), { replace: true })
    } else if (requestedIntent === "guide" || authUser?.user_type === "guide") {
      navigateTo("/guides/onboarding", { replace: true })
    } else {
      navigateTo(resolveSafeRedirect(next, "/app/dashboard"), { replace: true })
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
        <Button @click="navigateTo('/')">
          back home
        </Button>
      </div>
    </template>
  </div>
</template>
