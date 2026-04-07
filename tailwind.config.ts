import type { Config } from 'tailwindcss'

// Note: Tailwind v4 uses CSS-based configuration via @theme in globals.css.
// This file is kept for tooling compatibility. Active customizations live in app/globals.css.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '2px',
        full: '2px',
      },
    },
  },
}

export default config
