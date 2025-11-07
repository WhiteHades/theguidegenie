<script setup lang="ts">
import { AlertTriangleIcon } from "lucide-vue-next"
import { z } from "zod"
import type { Tour } from "database"

const props = defineProps<{
  open: boolean
  guideId?: string
  tours: Tour[]
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "created"): void
}>()

const supabase = useSupabase()

const formSchema = toTypedSchema(
  z.object({
    root: z.string().optional(),
    start_date: z.string().min(1, "start date is required"),
    start_time: z.string().min(1, "start time is required"),
    duration_hours: z.number().min(0.5, "duration must be at least 30 minutes").max(12),
    capacity: z.number().min(1, "capacity must be at least 1"),
    is_open: z.boolean(),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    start_date: "",
    start_time: "",
    duration_hours: 2,
    capacity: 10,
    is_open: true,
  },
})

const { handleSubmit, isSubmitting, errors, resetForm } = form

const onSubmit = handleSubmit(async (values) => {
  if (!props.guideId) {
    form.setFieldError("root", "guide id is required")
    return
  }

  try {
    // combine date and time into utc timestamp
    const startUtc = new Date(`${values.start_date}T${values.start_time}:00`)
    const endUtc = new Date(startUtc.getTime() + values.duration_hours * 60 * 60 * 1000)

    const { error } = await supabase
      .from("time_slots")
      .insert({
        guide_id: props.guideId,
        start_utc: startUtc.toISOString(),
        end_utc: endUtc.toISOString(),
        capacity: values.capacity,
        is_open: values.is_open,
      })

    if (error) throw error

    emit("created")
    emit("update:open", false)
    resetForm()
  } catch (e: any) {
    form.setFieldError("root", e.message || "failed to create time slot")
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>add time slot</DialogTitle>
        <DialogDescription>
          create an available time for tourists to book
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <Alert v-if="errors.root" variant="error">
          <AlertTriangleIcon class="size-6" />
          <AlertDescription>{{ errors.root }}</AlertDescription>
        </Alert>

        <div class="grid grid-cols-2 gap-4">
          <FormField v-slot="{ componentField }" name="start_date">
            <FormItem>
              <FormLabel for="start_date" required>
                date
              </FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="start_time">
            <FormItem>
              <FormLabel for="start_time" required>
                time
              </FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="time" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <FormField v-slot="{ componentField }" name="duration_hours">
          <FormItem>
            <FormLabel for="duration_hours" required>
              duration (hours)
            </FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                type="number"
                step="0.5"
                min="0.5"
                max="12"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="capacity">
          <FormItem>
            <FormLabel for="capacity" required>
              capacity
            </FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                type="number"
                min="1"
              />
            </FormControl>
            <FormDescription>
              maximum number of tourists
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="is_open">
          <FormItem class="flex items-center gap-2">
            <FormControl>
              <input
                type="checkbox"
                :checked="value"
                @change="handleChange"
                class="size-4"
              />
            </FormControl>
            <FormLabel for="is_open" class="!mt-0">
              open for bookings
            </FormLabel>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            cancel
          </Button>
          <Button type="submit" :loading="isSubmitting">
            create slot
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

