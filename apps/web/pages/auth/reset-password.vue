<script setup lang="ts">
import { ArrowRightIcon, CheckCircleIcon, LockIcon } from "lucide-vue-next";
import { z } from "zod";
import { toast } from "@/modules/ui/components/toast";

definePageMeta({ layout: "saas-auth" });
useSeoMeta({ title: "set a new password" });

const route = useRoute();
const { updatePassword } = useAuth();

const formSchema = toTypedSchema(
  z
    .object({
      password: z.string().min(8, "password must be at least 8 characters"),
      confirmPassword: z.string().min(8, "please confirm your password"),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: "passwords do not match",
      path: ["confirmPassword"],
    }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    password: "",
    confirmPassword: "",
  },
});

const { handleSubmit, isSubmitting, setFieldError } = form;
const success = ref(false);

const onSubmit = handleSubmit(async (values) => {
  try {
    await updatePassword(values.password);
    success.value = true;
    toast({ title: "password updated", variant: "success" });

    setTimeout(() => {
      navigateTo(resolveSafeRedirect(typeof route.query.next === "string" ? route.query.next : null, "/app/dashboard"));
    }, 1200);
  } catch (error: any) {
    setFieldError("password", error.message || "failed to update password");
    toast({ title: "password reset failed", description: error.message, variant: "error" });
  }
});
</script>

<template>
  <div class="space-y-6">
    <div v-if="success" class="space-y-4 text-center">
      <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircleIcon class="size-8 text-primary" />
      </div>
      <div>
        <h1 class="font-display text-2xl font-semibold tracking-tight">password updated</h1>
        <p class="mt-2 text-sm text-muted-foreground">redirecting you back into your account...</p>
      </div>
    </div>

    <template v-else>
      <div class="space-y-2 text-center">
        <h1 class="font-display text-2xl font-semibold tracking-tight">set a new password</h1>
        <p class="text-sm text-muted-foreground">choose a fresh password for your account</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>new password</FormLabel>
            <div class="relative">
              <LockIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input v-bind="componentField" type="password" class="pl-10" autocomplete="new-password" />
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel>confirm password</FormLabel>
            <div class="relative">
              <LockIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input v-bind="componentField" type="password" class="pl-10" autocomplete="new-password" />
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <Button class="w-full" type="submit" :disabled="isSubmitting">
          <Spinner v-if="isSubmitting" size="sm" class="mr-2" />
          <span v-if="isSubmitting">saving...</span>
          <template v-else>
            save new password
            <ArrowRightIcon class="ml-2 size-4" />
          </template>
        </Button>
      </form>
    </template>
  </div>
</template>
