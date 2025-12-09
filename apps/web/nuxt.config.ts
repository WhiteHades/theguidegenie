import path from "node:path";
import { getBaseUrl } from "utils";

const baseUrl = getBaseUrl();

export default defineNuxtConfig({
  compatibilityDate: '2025-11-08',
  devtools: {
    enabled: true,
  },

  alias: {
    "@config": path.resolve(__dirname, path.join("..", "..", "config")),
  },

  experimental: {
    typedPages: true,
    cookieStore: false,
  },

  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    public: {
      siteUrl: baseUrl,
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      s3AvatarsBucketName: process.env.NUXT_PUBLIC_S3_AVATARS_BUCKET_NAME,
      analytics: {
        googleAnalyticsId: process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID,
        mixpanelToken: process.env.NUXT_PUBLIC_MIXPANEL_TOKEN,
        pirschCode: process.env.NUXT_PUBLIC_PIRSCH_CODE,
        plausibleUrl: process.env.NUXT_PUBLIC_PLAUSIBLE_URL,
        umamiTrackingId: process.env.NUXT_PUBLIC_UMAMI_TRACKING_ID,
      },
      auth: {
        redirectPath: "/app/dashboard",
      },
      unsplashAccessKey: process.env.NUXT_PUBLIC_UNSPLASH_ACCESS_KEY,
    },
  },

  imports: {
    dirs: [
      "modules/saas/auth/composables/**",
      "modules/saas/dashboard/composables/**",
      "modules/saas/shared/**",
      "modules/shared/composables/**",
      "modules/shared/utils/**",
      "modules/ui/lib/**",
      "modules/marketing/shared/util/**",
      "modules/marketing/content/**",
    ],
  },

  components: [
    { path: "@/modules/shared/components", pathPrefix: false },
    { path: "@/modules/marketing/shared/components", pathPrefix: false },
    { path: "@/modules/marketing/home/components", pathPrefix: false },
    { path: "@/modules/marketing/blog/components", pathPrefix: false },
    { path: "@/modules/marketing/faq/components", pathPrefix: false },
    { path: "@/modules/marketing/changelog/components", pathPrefix: false },
    { path: "@/modules/marketing/content/components", pathPrefix: false },
    { path: "@/modules/marketing/pricing/components", pathPrefix: false },
    { path: "@/modules/saas/admin/components", pathPrefix: false },
    { path: "@/modules/saas/auth/components", pathPrefix: false },
    { path: "@/modules/saas/dashboard/components", pathPrefix: false },
    { path: "@/modules/saas/onboarding/components", pathPrefix: false },
    { path: "@/modules/saas/settings/components", pathPrefix: false },
    { path: "@/modules/saas/shared/components", pathPrefix: false },
  ],

  app: {
    head: {
      // critical inline CSS to prevent FOUC
      style: [
        {
          children: `
            html { background-color: hsl(222.2, 84%, 4.9%); }
            html.light { background-color: hsl(0, 0%, 100%); }
            body { opacity: 0; transition: opacity 0.15s ease-in; }
            body.ready { opacity: 1; }
          `,
        },
      ],
      script: [
        {
          children: `
            (function() {
              var colorMode = localStorage.getItem('NUXT_COLOR_MODE');
              if (colorMode === 'light') {
                document.documentElement.classList.add('light');
              } else if (colorMode === 'dark') {
                document.documentElement.classList.add('dark');
              } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                document.documentElement.classList.add('light');
              } else {
                document.documentElement.classList.add('dark');
              }
              function showBody() {
                requestAnimationFrame(function() {
                  requestAnimationFrame(function() {
                    document.body.classList.add('ready');
                  });
                });
              }
              if (document.readyState === 'complete') {
                showBody();
              } else {
                window.addEventListener('load', showBody);
              }
            })();
          `,
        },
      ],
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/icon.png",
        },
      ],
    },
  },

  build: {
    transpile: ["trpc-nuxt"],
  },

  vite: {
    optimizeDeps: {
      include: ["cropperjs"],
    },
    css: {
      preprocessorOptions: {},
    },
    ssr: {
      noExternal: ["cropperjs"],
    },
  },

  nitro: {
    preset: 'vercel',
    future: {
      nativeSWR: true,
    },
    routeRules: {
      // Static assets 
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
      // HTML pages - always revalidate to get fresh content
      '/': {
        headers: {
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      },
      // All routes - security headers
      '/**': {
        headers: {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        },
      },
    },
  },

  modules: [
    "@nuxtjs/tailwindcss", // configured in tailwind.config.ts
    "@nuxtjs/google-fonts",
    "@nuxtjs/color-mode",
    "@nuxt/content",
    "@nuxt/image",
    // "@vue-email/nuxt", // not compatible with Nuxt 4
    "shadcn-nuxt",
    "@nuxtjs/seo",
    "@vee-validate/nuxt",
    "@vueuse/nuxt",
  ],

  // @nuxtjs/google-fonts
  googleFonts: {
    display: "block",
    preload: true,
    prefetch: true,
    families: {
      'Playfair Display': [600, 700],
      'DM Sans': [400, 500, 600, 700],
      Inter: [400, 500, 600],
    },
  },

  // @nuxtjs/color-mode
  colorMode: {
    preference: "system",
    fallback: "light",
    classSuffix: "",
    storageKey: "NUXT_COLOR_MODE",
  },

  // @nuxt/content
  content: {
    markdown: {
      anchorLinks: false,
    },
  },

  // @nuxt/image
  image: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com", "images.unsplash.com"],
  },

  shadcn: {
    prefix: "",
    componentDir: "./modules/ui/components",
  },

  // nuxt-simple-robots
  robots: {
    allow: "*",
    // sitemap: 'sitemap.xml',
  },

  // @vue-email/nuxt - Disabled, not compatible with Nuxt 4
  // vueEmail: {
  //   baseUrl,
  // },

  // @vee-validate/nuxt
  veeValidate: {
    // disable or enable auto imports
    autoImports: true,
    // Use different names for components
    componentNames: {
      Form: "Form",
      Field: "FormField",
      ErrorMessage: "ErrorMessage",
    },
  },
});
