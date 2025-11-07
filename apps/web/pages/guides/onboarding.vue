<script setup lang="ts">
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-vue-next"
import { z } from "zod"

definePageMeta({
  layout: "saas-auth",
})

useSeoMeta({
  title: "complete your guide profile - guidegenie",
})

const { user } = useAuth()
const supabase = useSupabase()

if (!user.value) {
  navigateTo('/guides/login')
}

const formSchema = toTypedSchema(
  z.object({
    root: z.string().optional(),
    name: z.string().min(2, "name must be at least 2 characters"),
    city: z.string().min(2, "city is required"),
    contact_email: z.string().email("invalid email address"),
    phone: z.string().optional(),
    bio: z.string().optional(),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: user.value?.name || "",
    city: "budapest",
    contact_email: user.value?.email || "",
    phone: user.value?.phone || "",
    bio: "",
  },
})

const { handleSubmit, isSubmitting, errors } = form
const success = ref(false)

const onSubmit = handleSubmit(async (values) => {
  if (!user.value) {
    form.setFieldError("root", "you must be logged in to create a guide profile")
    return
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

    if (error) throw error

    success.value = true
    
    // redirect to dashboard after brief success message
    setTimeout(() => {
      navigateTo("/guides/dashboard")
    }, 1500)
  } catch (e: any) {
    form.setFieldError("root", e.message || "failed to create guide profile. please try again.")
  }
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold">complete your profile</h1>
    <p class="mb-6 mt-2 text-muted-foreground">
      tell us about yourself to start offering tours
    </p>

    <Alert v-if="success" variant="success" class="mb-6">
      <CheckCircle2Icon class="size-6" />
      <AlertDescription>
        profile created successfully! redirecting to dashboard...
      </AlertDescription>
    </Alert>

    <form v-if="!success" @submit.prevent="onSubmit" class="flex flex-col items-stretch gap-6">
      <Alert v-if="errors.root" variant="error">
        <AlertTriangleIcon class="size-6" />
        <AlertDescription>{{ errors.root }}</AlertDescription>
      </Alert>

      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel for="name" required>
            display name
          </FormLabel>
          <FormControl>
            <Input v-bind="componentField" autocomplete="name" />
          </FormControl>
          <FormDescription>
            this is how tourists will see your name
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="city">
        <FormItem>
          <FormLabel for="city" required>
            city
          </FormLabel>
          <FormControl>
            <Input v-bind="componentField" />
          </FormControl>
          <FormDescription>
            which city do you offer tours in?
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="contact_email">
        <FormItem>
          <FormLabel for="contact_email" required>
            contact email
          </FormLabel>
          <FormControl>
            <Input v-bind="componentField" type="email" />
          </FormControl>
          <FormDescription>
            tourists will use this to reach you
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="phone">
        <FormItem>
          <FormLabel for="phone">
            phone number
          </FormLabel>
          <FormControl>
            <Input v-bind="componentField" type="tel" />
          </FormControl>
          <FormDescription>
            optional - for booking confirmations
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="bio">
        <FormItem>
          <FormLabel for="bio">
            bio
          </FormLabel>
          <FormControl>
            <Textarea v-bind="componentField" rows="4" />
          </FormControl>
          <FormDescription>
            tell tourists about your experience and expertise
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button :loading="isSubmitting" type="submit">
        create guide profile &rarr;
      </Button>
    </form>
  </div>
</template>

