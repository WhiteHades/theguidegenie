<script setup lang="ts">
import {
  UserIcon,
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  MapPinIcon,
  CheckIcon,
  ArrowLeftIcon,
} from "lucide-vue-next";
import { z } from "zod";
import { toast } from "@/modules/ui/components/toast";

definePageMeta({ layout: "saas-auth" });
useSeoMeta({ title: "become a guide" });

const { signup } = useAuth();

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, "name must be at least 2 characters"),
    email: z.string().email("enter a valid email"),
    password: z.string().min(8, "password must be at least 8 characters"),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: { name: "", email: "", password: "" },
  validateOnBlur: false,
  validateOnChange: false,
  validateOnMount: false,
});

const { handleSubmit, isSubmitting, setFieldError } = form;

const onSubmit = handleSubmit(async (values) => {
  try {
    await signup({
      email: values.email,
      password: values.password,
      name: values.name,
      userType: "guide",
    });
    toast({
      title: "account created!",
      description: "let's set up your guide profile",
      variant: "success",
    });
    navigateTo("/guides/onboarding");
  } catch (e: any) {
    setFieldError("email", e.message || "signup failed");
    toast({ title: "signup failed", description: e.message, variant: "error" });
  }
});

const perks = [
  "reach thousands of tourists",
  "set your own schedule",
  "keep 95% of earnings",
  "free booking system",
];
</script>

<template>
  <div class="space-y-6">
    <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground smooth">
      <ArrowLeftIcon class="size-3" /> back
    </NuxtLink>

    <div class="space-y-2 text-center">
      <Badge variant="info" class="inline-flex items-center gap-1.5">
        <MapPinIcon class="size-3" />
        budapest guides
      </Badge>
      <h1 class="font-display text-2xl font-semibold tracking-tight">
        become a guide
      </h1>
      <p class="text-sm text-muted-foreground">
        share your passion with travelers worldwide
      </p>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <Card
        v-for="perk in perks"
        :key="perk"
        class="flex items-center gap-2 border-0 bg-muted/50 px-3 py-2"
      >
        <CheckIcon class="size-3.5 shrink-0 text-primary" />
        <span class="text-xs">{{ perk }}</span>
      </Card>
    </div>

    <SocialLoginButtons redirect-to="/guides/onboarding" />

    <div class="relative">
      <Separator />
      <span
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground"
      >
        or
      </span>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-4">
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>full name</FormLabel>
          <div class="relative">
            <UserIcon
              class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-bind="componentField"
              class="pl-10"
              placeholder="john doe"
              autocomplete="name"
            />
          </div>
          <FormMessage />
        </FormItem>
      </FormField>

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
          <FormLabel>password</FormLabel>
          <div class="relative">
            <LockIcon
              class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-bind="componentField"
              type="password"
              class="pl-10"
              placeholder="••••••••"
              autocomplete="new-password"
            />
          </div>
          <FormDescription class="text-xs">minimum 8 characters</FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <p class="text-xs text-muted-foreground">
        by signing up, you agree to our
        <Button variant="link" size="sm" class="inline h-auto p-0 text-xs text-foreground" as-child>
          <NuxtLink to="/legal/terms">terms</NuxtLink>
        </Button>
        and
        <Button variant="link" size="sm" class="inline h-auto p-0 text-xs text-foreground" as-child>
          <NuxtLink to="/legal/privacy">privacy policy</NuxtLink>
        </Button>
      </p>

      <Button class="w-full" type="submit" :disabled="isSubmitting">
        <Spinner v-if="isSubmitting" size="sm" class="mr-2" />
        <span v-if="isSubmitting">creating account...</span>
        <template v-else>
          create guide account
          <ArrowRightIcon class="ml-2 size-4" />
        </template>
      </Button>
    </form>

    <div class="relative">
      <Separator />
      <span
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground"
      >
        already a guide?
      </span>
    </div>

    <Button variant="outline" class="w-full" as-child>
      <NuxtLink to="/guides/login">
        sign in
        <ArrowRightIcon class="ml-2 size-4" />
      </NuxtLink>
    </Button>
  </div>
</template>
