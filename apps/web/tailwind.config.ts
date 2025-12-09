import baseConfig from "tailwind-config";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [baseConfig],
  darkMode: "class",
  content: [
    "./layouts/**/*.{vue,ts}",
    "./modules/**/*.{vue,ts}",
    "./pages/**/*.{vue,ts}",
  ],
  safelist: ["ml-2", "ml-4", "ml-6", "ml-8"],
  theme: {
    extend: {
      screens: {
        'xs': '375px', // iPhone SE and small phones
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
        },
      },
    },
  },
};

export default config;
