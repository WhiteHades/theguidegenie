<script setup lang="ts">
  import {
    ArrowRightIcon,
    CalendarDaysIcon,
    MapPinnedIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TicketIcon,
    UsersIcon,
  } from "lucide-vue-next";

  const featureCards = [
    {
      title: "book instantly",
      description: "travellers can browse live availability, reserve a slot, and receive a secure booking link in minutes.",
      cta: "/tours",
      ctaLabel: "explore tours",
      points: [
        { icon: CalendarDaysIcon, label: "real upcoming slots" },
        { icon: ShieldCheckIcon, label: "private booking links" },
      ],
    },
    {
      title: "run tours simply",
      description: "guides can onboard, publish listings, add future slots, and review every confirmed guest from one dashboard.",
      cta: "/guides/signup",
      ctaLabel: "become a guide",
      points: [
        { icon: TicketIcon, label: "guided tour creation" },
        { icon: UsersIcon, label: "booking visibility" },
      ],
    },
    {
      title: "trust the flow",
      description: "guest and signed-in travellers use the same streamlined booking flow, protected by server-side checks and secure database rules.",
      cta: "/auth/tourist/signup",
      ctaLabel: "create traveller account",
      points: [
        { icon: MapPinnedIcon, label: "guide and meeting point details" },
        { icon: SparklesIcon, label: "simple account recovery" },
      ],
    },
  ];
</script>

<template>
  <section class="py-24 text-card-foreground">
    <div class="container">
      <div class="text-center">
        <h1 class="text-4xl font-bold lg:text-5xl">why the guide genie works</h1>
        <p class="mt-3 text-lg text-foreground/60">
          a focused marketplace for local experiences, built around simple booking and reliable guide workflows.
        </p>
      </div>

      <div class="mt-12 grid grid-cols-1 gap-8">
        <div
          v-for="(card, index) in featureCards"
          :key="card.title"
          class="grid items-center gap-8 rounded-2xl border bg-card/50 p-8 lg:grid-cols-2 lg:gap-16"
        >
          <div class="overflow-hidden rounded-xl bg-primary/10 p-12" :class="index === 1 ? 'lg:order-2' : ''">
            <div class="grid gap-4">
              <div class="rounded-2xl border border-primary/10 bg-background/70 p-5 shadow-sm">
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{{ card.title }}</div>
                <div class="mt-3 h-3 w-3/4 rounded-full bg-primary/15" />
                <div class="mt-2 h-3 w-full rounded-full bg-primary/10" />
                <div class="mt-2 h-3 w-5/6 rounded-full bg-primary/10" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="point in card.points" :key="point.label" class="rounded-xl border border-primary/10 bg-background/80 p-4">
                  <component :is="point.icon" class="size-5 text-primary" />
                  <div class="mt-3 text-sm font-medium">{{ point.label }}</div>
                </div>
              </div>
            </div>
          </div>

          <div :class="index === 1 ? 'lg:order-1' : ''">
            <h3 class="text-3xl font-bold">{{ card.title }}</h3>
            <p class="mt-2 leading-normal text-foreground/60">{{ card.description }}</p>
            <Button variant="secondary" size="sm" class="mt-4" as-child>
              <NuxtLink :to="card.cta">
              {{ card.ctaLabel }}
              <ArrowRightIcon class="ml-2 size-4" />
              </NuxtLink>
            </Button>

            <div class="mt-6 grid grid-cols-2 gap-4">
              <div v-for="point in card.points" :key="point.label" class="text-card-foreground">
                <component :is="point.icon" class="size-6 text-3xl text-highlight" />
                <strong class="mt-2 block">{{ point.label }}</strong>
                <p class="text-foreground/60">built to stay simple for both travellers and guides.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
