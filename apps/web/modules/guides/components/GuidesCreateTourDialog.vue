<script setup lang="ts">
import { AlertTriangleIcon } from "lucide-vue-next"
import { z } from "zod"

const props = defineProps<{
  open: boolean
  guideId?: string
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "created"): void
}>()

const supabase = useSupabase()

const formSchema = toTypedSchema(
  z.object({
    root: z.string().optional(),
    title: z.string().min(3, "title must be at least 3 characters"),
    description: z.string().optional(),
    base_price_cents: z.number().min(0, "price must be positive").optional(),
    is_public: z.boolean(),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: "",
    description: "",
    base_price_cents: undefined,
    is_public: true,
  },
})

const { handleSubmit, isSubmitting, errors, resetForm } = form

const onSubmit = handleSubmit(async (values) => {
  if (!props.guideId) {
    form.setFieldError("root", "guide id is required")
    return
  }

  try {
    const { error } = await supabase
      .from("tours")
      .insert({
        guide_id: props.guideId,
        title: values.title,
        description: values.description || null,
        base_price_cents: values.base_price_cents || null,
        is_public: values.is_public,
      })

    if (error) throw error

    emit("created")
    emit("update:open", false)
    resetForm()
  } catch (e: any) {
    form.setFieldError("root", e.message || "failed to create tour")
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>create new tour</DialogTitle>
        <DialogDescription>
          add a new tour offering to your profile
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <Alert v-if="errors.root" variant="error">
          <AlertTriangleIcon class="size-6" />
          <AlertDescription>{{ errors.root }}</AlertDescription>
        </Alert>

        <FormField v-slot="{ componentField }" name="title">
          <FormItem>
            <FormLabel for="title" required>
              tour title
            </FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="historic budapest walking tour" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel for="description">
              description
            </FormLabel>
            <FormControl>
              <Textarea v-bind="componentField" rows="3" placeholder="explore the hidden gems of budapest..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="base_price_cents">
          <FormItem>
            <FormLabel for="base_price_cents">
              base price (€)
            </FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                type="number"
                step="0.01"
                placeholder="25.00"
                @input="(e: any) => componentField['onInput']({ ...e, target: { ...e.target, value: Math.round(parseFloat(e.target.value || '0') * 100) } })"
              />
            </FormControl>
            <FormDescription>
              optional - leave empty if price varies
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="is_public">
          <FormItem class="flex items-center gap-2">
            <FormControl>
              <input
                type="checkbox"
                :checked="value"
                @change="handleChange"
                class="size-4"
              />
            </FormControl>
            <FormLabel for="is_public" class="!mt-0">
              make this tour public
            </FormLabel>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            cancel
          </Button>
          <Button type="submit" :loading="isSubmitting">
            create tour
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

