<script setup lang="ts">
import { 
  UserIcon, 
  MapPinIcon, 
  MailIcon, 
  PhoneIcon, 
  FileTextIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "lucide-vue-next"
import { z } from "zod"
import { toast } from "@/modules/ui/components/toast"

definePageMeta({ layout: "saas-auth" })
useSeoMeta({ title: "complete your profile" })

const { user, fetchGuideProfile } = useAuth()
const supabase = useSupabase()

// redirect if not logged in
if (!user.value) {
  navigateTo('/guides/login')
}

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, "name must be at least 2 characters"),
    city: z.string().min(2, "city is required"),
    contact_email: z.string().email("enter a valid email"),
    phone: z.string().optional(),
    bio: z.string().max(500, "bio must be under 500 characters").optional(),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: user.value?.name || "",
    city: "budapest",
    contact_email: user.value?.email || "",
    phone: "",
    bio: "",
  },
})

const { handleSubmit, isSubmitting, setFieldError, values } = form
const success = ref(false)

const bioLength = computed(() => values.bio?.length || 0)

const onSubmit = handleSubmit(async (values) => {
  if (!user.value) {
    toast({ title: "please log in first", variant: "error" })
    return navigateTo('/guides/login')
  }

  try {
    const { error } = await supabase
      .from("guides")
      .insert({
        user_id: user.value.id,
        name: values.name,
        city: values.city,
        contact_email: values.contact_email,
        phone: values.phone || null,
        bio: values.bio || null,
      })

    if (error) {
      if (error.message.includes('duplicate')) {
        throw new Error('you already have a guide profile')
      }
      throw error
    }

    // refresh guide profile in auth state
    await fetchGuideProfile()

    success.value = true
    toast({ title: "profile created!", description: "redirecting to dashboard...", variant: "success" })
    
    setTimeout(() => {
      navigateTo("/guides/dashboard")
    }, 1500)
  } catch (e: any) {
    setFieldError("name", e.message || "failed to create profile")
    toast({ title: "error", description: e.message, variant: "error" })
  }
})
</script>

<template>
  <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- success state -->
    <div v-if="success" class="py-12 text-center">
      <div class="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
        <CheckCircleIcon class="size-10 text-primary" />
      </div>
      <h1 class="font-display text-2xl font-bold">you're all set!</h1>
      <p class="mt-2 text-muted-foreground">taking you to your dashboard...</p>
      <div class="mt-6">
        <div class="mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>

    <!-- form state -->
    <template v-else>
      <!-- header -->
      <div class="mb-8">
        <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <SparklesIcon class="size-3.5" />
          final step
        </div>
        <h1 class="font-display text-3xl font-bold">complete your profile</h1>
        <p class="mt-2 text-muted-foreground">tell tourists about yourself to start offering tours</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-5">
        <!-- name -->
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel class="small-caps text-xs font-medium tracking-wider">display name</FormLabel>
            <div class="relative">
              <UserIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-bind="componentField"
                class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="how tourists will see your name"
                autocomplete="name"
              />
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- city -->
        <FormField v-slot="{ componentField }" name="city">
          <FormItem>
            <FormLabel class="small-caps text-xs font-medium tracking-wider">city</FormLabel>
            <div class="relative">
              <MapPinIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-bind="componentField"
                class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="where you offer tours"
              />
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- contact email -->
        <FormField v-slot="{ componentField }" name="contact_email">
          <FormItem>
            <FormLabel class="small-caps text-xs font-medium tracking-wider">contact email</FormLabel>
            <div class="relative">
              <MailIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-bind="componentField"
                type="email"
                class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="tourists will use this to reach you"
              />
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- phone (optional) -->
        <FormField v-slot="{ componentField }" name="phone">
          <FormItem>
            <FormLabel class="small-caps text-xs font-medium tracking-wider">
              phone
              <span class="ml-1 text-muted-foreground">(optional)</span>
            </FormLabel>
            <div class="relative">
              <PhoneIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-bind="componentField"
                type="tel"
                class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="+36 ..."
              />
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- bio (optional) -->
        <FormField v-slot="{ componentField }" name="bio">
          <FormItem>
            <div class="flex items-center justify-between">
              <FormLabel class="small-caps text-xs font-medium tracking-wider">
                bio
                <span class="ml-1 text-muted-foreground">(optional)</span>
              </FormLabel>
              <span class="text-xs text-muted-foreground">{{ bioLength }}/500</span>
            </div>
            <div class="relative">
              <FileTextIcon class="absolute left-4 top-3 size-4 text-muted-foreground" />
              <Textarea
                v-bind="componentField"
                rows="4"
                class="rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="tell tourists about your experience, what makes your tours special..."
              />
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- submit -->
        <Button
          class="h-12 w-full rounded-xl btn-bounce text-sm font-medium"
          type="submit"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">creating profile...</span>
          <span v-else class="flex items-center gap-2">
            create guide profile
            <ArrowRightIcon class="size-4" />
          </span>
        </Button>
      </form>
    </template>
  </div>
</template>
