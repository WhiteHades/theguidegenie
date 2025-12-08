<script setup lang="ts">
import {
  MailIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "lucide-vue-next";
import { z } from "zod";
import { toast } from "@/modules/ui/components/toast";

definePageMeta({ layout: "saas-auth" });
useSeoMeta({ title: "reset password" });

const { requestPasswordReset } = useAuth();

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email("enter a valid email"),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: { email: "" },
});

const { handleSubmit, isSubmitting, setFieldError } = form;
const emailSent = ref(false);
const sentEmail = ref("");

const onSubmit = handleSubmit(async (values) => {
  try {
    await requestPasswordReset(values.email);
    sentEmail.value = values.email;
    emailSent.value = true;
    toast({ title: "reset link sent!", variant: "success" });
  } catch (e: any) {
    setFieldError("email", e.message || "failed to send reset email");
    toast({ title: "error", description: e.message, variant: "error" });
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- success state -->
    <div v-if="emailSent" class="space-y-6">
      <Alert variant="success" class="text-center">
        <CheckCircleIcon class="size-5" />
        <AlertTitle class="font-display text-lg font-semibold">
          check your email
        </AlertTitle>
        <AlertDescription>
          we've sent a password reset link to
          <span class="font-medium text-foreground">{{ sentEmail }}</span>
        </AlertDescription>
      </Alert>
      <p class="text-center text-sm text-muted-foreground">
        didn't receive the email? check your spam folder or
        <Button
          variant="link"
          size="sm"
          class="h-auto p-0"
          @click="emailSent = false"
        >
          try again
        </Button>
      </p>
      <Button variant="ghost" as-child class="w-full">
        <NuxtLink to="/guides/login">
          <ArrowLeftIcon class="mr-2 size-4" />
          back to login
        </NuxtLink>
      </Button>
    </div>

    <!-- form state -->
    <template v-else>
      <Button variant="ghost" size="sm" as-child class="-ml-2">
        <NuxtLink to="/guides/login">
          <ArrowLeftIcon class="mr-2 size-4" />
          back to login
        </NuxtLink>
      </Button>

      <div class="space-y-2 text-center">
        <h1 class="font-display text-2xl font-semibold tracking-tight">
          reset password
        </h1>
        <p class="text-sm text-muted-foreground">
          enter your email and we'll send you a reset link
        </p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>email</FormLabel>
            <div class="relative">
              <MailIcon
                class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                v-bind="componentField"
                type="email"
                class="pl-10"
                placeholder="you@example.com"
                autocomplete="email"
              />
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <Button class="w-full" type="submit" :disabled="isSubmitting">
          <Spinner v-if="isSubmitting" size="sm" class="mr-2" />
          <span v-if="isSubmitting">sending...</span>
          <template v-else>
            send reset link
            <ArrowRightIcon class="ml-2 size-4" />
          </template>
        </Button>
      </form>
    </template>
  </div>
</template>
