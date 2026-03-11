<script setup lang="ts">
import { z } from "zod";
import { toast } from "@/modules/ui/components/toast";

definePageMeta({
  layout: "saas-app",
  middleware: ["tourist-auth"],
});

useSeoMeta({ title: "my account" });

await callOnce(() => useAuth().fetchUser());

const auth = useAuth();

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2),
    phone: z.string().optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: auth.user.value?.name || "",
    phone: auth.user.value?.phone || "",
  },
});

watch(
  () => auth.user.value,
  (nextUser) => {
    if (!nextUser) 
return;
    form.setValues({
      name: nextUser.name || "",
      phone: nextUser.phone || "",
    });
  },
  { immediate: true },
);

const { handleSubmit, isSubmitting, setFieldError } = form;

const onSubmit = handleSubmit(async (values) => {
  try {
    await auth.updateProfile(values);
    toast({ title: "account updated", variant: "success" });
  } catch (error: any) {
    setFieldError("name", error.message || "failed to update account");
    toast({ title: "update failed", description: error.message, variant: "error" });
  }
});
</script>

<template>
  <div class="container max-w-2xl py-8">
    <div class="mb-8">
      <h1 class="font-display text-3xl font-bold">my account</h1>
      <p class="mt-2 text-muted-foreground">keep your traveller profile up to date</p>
    </div>

    <Card>
      <CardContent class="p-6">
        <form class="space-y-4" @submit.prevent="onSubmit">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>name</FormLabel>
              <Input v-bind="componentField" />
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="phone">
            <FormItem>
              <FormLabel>phone</FormLabel>
              <Input v-bind="componentField" />
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" :disabled="isSubmitting">
            <Spinner v-if="isSubmitting" size="sm" class="mr-2" />
            save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
