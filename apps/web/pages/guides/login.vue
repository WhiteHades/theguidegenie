<script setup lang="ts">
import { AlertTriangleIcon } from "lucide-vue-next"
import { z } from "zod"

definePageMeta({
  layout: "saas-auth",
})

useSeoMeta({
  title: "guide login - guidegenie",
})

const { signin, checkIsGuide } = useAuth()

const formSchema = toTypedSchema(
  z.object({
    root: z.string().optional(),
    email: z.string().email("invalid email address"),
    password: z.string().min(1, "password is required"),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    email: "",
    password: "",
  },
})

const { handleSubmit, isSubmitting, errors } = form

const onSubmit = handleSubmit(async (values) => {
  try {
    await signin(values.email, values.password)
    
    // check if user has guide profile
    const isGuide = await checkIsGuide()
    
    if (!isGuide) {
      // redirect to onboarding if no guide profile
      navigateTo("/guides/onboarding")
    } else {
      // redirect to dashboard
      navigateTo("/guides/dashboard")
    }
  } catch (e: any) {
    form.setFieldError("root", e.message || "invalid credentials. please try again.")
  }
})
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold">guide login</h1>
    <p class="mb-6 mt-4 text-muted-foreground">
      sign in to manage your tours and bookings
    </p>

    <form @submit.prevent="onSubmit" class="flex flex-col items-stretch gap-6">
      <Alert v-if="errors.root" variant="error">
        <AlertTriangleIcon class="size-6" />
        <AlertDescription>{{ errors.root }}</AlertDescription>
      </Alert>

      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel for="email" required>
            email
          </FormLabel>
          <Input
            v-bind="componentField"
            type="email"
            id="email"
            required
            autocomplete="email"
          />
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <FormLabel for="password" required>
            password
          </FormLabel>
          <Input
            v-bind="componentField"
            type="password"
            id="password"
            autocomplete="current-password"
            required
          />
          <FormMessage />
        </FormItem>
      </FormField>

      <Button
        class="w-full"
        type="submit"
        variant="secondary"
        :loading="isSubmitting"
      >
        sign in
      </Button>

      <div class="text-center text-sm">
        <span class="text-muted-foreground">
          don't have an account?&nbsp;
        </span>
        <NuxtLink to="/guides/signup">
          become a guide &rarr;
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

