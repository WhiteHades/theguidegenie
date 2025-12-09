<script setup lang="ts">
import { MailIcon, LockIcon, ArrowRightIcon, CompassIcon } from "lucide-vue-next";
import { z } from "zod";
import { toast } from "@/modules/ui/components/toast";

definePageMeta({ layout: "saas-auth" });
useSeoMeta({ title: "sign in" });

const { signin, isAuthenticated } = useAuth();

watchEffect(() => {
  if (isAuthenticated.value) {
    navigateTo("/tours");
  }
});

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email("enter a valid email"),
    password: z.string().min(1, "password is required"),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: { email: "", password: "" },
  validateOnBlur: false,
  validateOnChange: false,
  validateOnMount: false,
});

const { handleSubmit, isSubmitting, setFieldError } = form;

const onSubmit = handleSubmit(async (values) => {
  try {
    const user = await signin(values.email, values.password);
    toast({ title: "welcome back!", variant: "success" });

    if (user.user_type === "guide") {
      navigateTo("/guides/dashboard");
    } else {
      navigateTo("/tours");
    }
  } catch (e: any) {
    setFieldError("email", e.message || "invalid credentials");
    toast({ title: "login failed", description: e.message, variant: "error" });
  }
});
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <Badge variant="info" class="inline-flex items-center gap-1.5">
        <CompassIcon class="size-3" />
        welcome back
      </Badge>
      <h1 class="font-display text-2xl font-semibold tracking-tight">sign in</h1>
      <p class="text-sm text-muted-foreground">
        continue your budapest adventure
      </p>
    </div>

    <SocialLoginButtons />

    <div class="relative">
      <Separator />
      <span
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground"
      >
        or
      </span>
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

      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <div class="flex items-center justify-between">
            <FormLabel>password</FormLabel>
            <Button variant="link" size="sm" class="inline h-auto p-0 text-xs text-muted-foreground" as-child>
              <NuxtLink to="/auth/forgot-password">forgot password?</NuxtLink>
            </Button>
          </div>
          <div class="relative">
            <LockIcon
              class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-bind="componentField"
              type="password"
              class="pl-10"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button class="w-full" type="submit" :disabled="isSubmitting">
        <Spinner v-if="isSubmitting" size="sm" class="mr-2" />
        <span v-if="isSubmitting">signing in...</span>
        <template v-else>
          sign in
          <ArrowRightIcon class="ml-2 size-4" />
        </template>
      </Button>
    </form>

    <div class="relative">
      <Separator />
      <span
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground"
      >
        new here?
      </span>
    </div>

    <Button variant="outline" class="w-full" as-child>
      <NuxtLink to="/auth/tourist/signup">
        create account
        <ArrowRightIcon class="ml-2 size-4" />
      </NuxtLink>
    </Button>

    <p class="text-center text-xs text-muted-foreground">
      are you a guide?
      <Button variant="link" size="sm" class="inline h-auto p-0 text-xs" as-child>
        <NuxtLink to="/guides/login">guide login</NuxtLink>
      </Button>
    </p>
  </div>
</template>
