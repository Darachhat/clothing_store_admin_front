import type { Config } from 'tailwindcss'

/**
 * Clothing Store — Tailwind CSS Configuration
 *
 * Strategy: extend (never override) so @nuxt/ui's built-in utilities stay intact.
 *
 * Design token mapping:
 *   CSS variable          → Tailwind utility class
 *   --surface-bg          → bg-surface-bg
 *   --surface-card        → bg-surface-card
 *   --text-primary        → text-ink
 *   --border-subtle       → border-subtle
 *   --brand-900           → text-brand-900 / bg-brand-900
 *   --status-green        → text-status-green / bg-status-green-bg
 *
 * Spacing: use Tailwind default scale (1=4px, 2=8px, 4=16px, 6=24px, 8=32px).
 * Our 8px grid maps cleanly: p-2=8px, p-4=16px, p-6=24px, p-8=32px, gap-3.5=14px.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({
  // Dark mode disabled in admin (light theme design system only)
  darkMode: ['selector', '[data-theme="dark"]'],

  theme: {
    extend: {
      // ── Color System ──────────────────────────────────────────────────
      colors: {
        // Surfaces
        surface: {
          bg: '#F3F4F4',      // page canvas / gray wash
          card: '#FFFFFF',    // elevated cards, panels
        inset: '#F3F4F4',   // table head, inset panels
          input: '#FFFFFF',   // form inputs
          hover: '#EAECEC',   // hover state
          active: '#DFE2E2',  // pressed / active state
        },

        // Borders (neutral only — per AGENTS.md rule: no colorful borders)
        subtle: '#E2E2E2',    // `border-subtle`  very faint dividers
        border: {
          subtle: '#E2E2E2',
          default: '#C8C8C8',
          strong: '#8F8F8F',
        },

        // Text / Ink
        ink: {
          DEFAULT: '#000000',   // body text  (`text-ink`)
          secondary: '#4A4F58', // labels, meta
          tertiary: '#5E646E',  // placeholders, hints
          inverse: '#FFFFFF',   // white text on dark bg
        },

        // Brand palette — blue primary (brand-900 === primary), navy chrome, gold active accent
        brand: {
          50:  '#000000',
          700: '#262626',
          800: '#1A1A1A',
          900: '#000000',  // main brand accent  (`bg-brand-900`, `text-brand-900`)
        },
        action: {
          DEFAULT: '#000000',
          hover: '#1A1A1A',
          soft: '#000000',
        },
        navy: {
          DEFAULT: '#000000',
          deep: '#1A1A1A',
        },
        gold: '#F5B90F',

        // Status — muted, matches --status-* vars
        status: {
          green:    '#2A7C13',
          'green-bg': '#2A7C13',
          amber:    '#9A5B00',
          'amber-bg': '#8A5300',
          red:      '#830000',
          'red-bg': '#830000',
          blue:     '#000000',
          'blue-bg': '#000000',
        },
      },

      // ── Typography ────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Inter Tight', 'ui-monospace', 'Cascadia Code', 'monospace'],
        khmer: ['Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'Battambang Local', 'Inter', 'sans-serif'],
      },

      // ── Border Radius ─────────────────────────────────────────────────
      borderRadius: {
        sm: '4px',   // `rounded-sm`
        md: '8px',   // `rounded-md`  (also Tailwind default)
        lg: '12px',  // `rounded-lg`
        xl: '16px',  // `rounded-xl`
        full: '9999px',
      },

      // ── Box Shadow ────────────────────────────────────────────────────
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.05)',
        menu: '0 8px 24px rgba(0,0,0,0.12)',
        modal: '0 20px 40px rgba(0,0,0,0.24)',
        header: '0 1px 4px rgba(0,0,0,0.06)',
        focus: '0 0 0 3px rgba(0,0,0,0.12)',
      },

      // ── Width shortcuts ───────────────────────────────────────────────
      width: {
        'sidebar-icon': '56px',
        'cart-panel': '410px',
      },

      minWidth: {
        'cart-panel': '410px',
      },

      // ── Height shortcuts ──────────────────────────────────────────────
      height: {
        'header': '60px',
        'checkout-btn': '48px',
      },

      minHeight: {
        'header': '60px',
      },
    },
  },

  // POS-specific safelist: classes generated dynamically (v-bind, template literals)
  safelist: [
    'bg-status-green-bg',
    'bg-status-amber-bg',
    'bg-status-red-bg',
    'bg-status-blue-bg',
    'text-status-green',
    'text-status-amber',
    'text-status-red',
    'text-status-blue',
  ],
} as unknown as Config)
