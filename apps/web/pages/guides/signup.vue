<script setup lang="ts">
import { AlertTriangleIcon } from "lucide-vue-next"
import { z } from "zod"

definePageMeta({
  layout: "saas-auth",
})

useSeoMeta({
  title: "guide signup - guidegenie",
})

const { signup } = useAuth()

const formSchema = toTypedSchema(
  z.object({
    root: z.string().optional(),
    name: z.string().min(2, "name must be at least 2 characters"),
    email: z.string().email("invalid email address"),
    password: z.string().min(8, "password must be at least 8 characters"),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    email: "",
    password: "",
  },
})

const { handleSubmit, isSubmitting, errors } = form

const onSubmit = handleSubmit(async (values) => {
  try {
    await signup(values.email, values.password, values.name, "guide")
    
    // redirect to onboarding to create guide profile
    navigateTo("/guides/onboarding")
  } catch (e: any) {
    form.setFieldError("root", e.message || "signup failed. please try again.")
  }
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold">become a guide</h1>
    <p class="mb-6 mt-2 text-muted-foreground">
      create your guide account to start offering tours in budapest
    </p>

    <form @submit.prevent="onSubmit" class="flex flex-col items-stretch gap-6">
      <Alert v-if="errors.root" variant="error">
        <AlertTriangleIcon class="size-6" />
        <AlertDescription>{{ errors.root }}</AlertDescription>
      </Alert>

      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel for="name" required>
            full name
          </FormLabel>
          <FormControl>
            <Input v-bind="componentField" autocomplete="name" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel for="email" required>
            email
          </FormLabel>
          <FormControl>
            <Input v-bind="componentField" type="email" autocomplete="email" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <FormLabel for="password" required>
            password
          </FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="password"
              autocomplete="new-password"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button :loading="isSubmitting" type="submit">
        create guide account &rarr;
      </Button>

      <p class="text-center text-sm">
        <span class="text-muted-foreground">
          already have an account?&nbsp;
        </span>
        <NuxtLink to="/guides/login">
          sign in &rarr;
        </NuxtLink>
      </p>
    </form>
  </div>
</template>

