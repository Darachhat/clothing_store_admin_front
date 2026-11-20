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
      // ── Color System (CDC Navy + Gold + Clean Slate Surfaces) ────────
      colors: {
        // Surfaces — crisp slate canvas & pure white elevated cards
        surface: {
          bg: '#F1F5F9',      // page canvas (slate-100)
          card: '#FFFFFF',    // elevated cards, panels
          inset: '#F8FAFC',   // table head, inset panels (slate-50)
          input: '#FFFFFF',   // form inputs
          hover: '#F1F5F9',   // subtle hover state
          active: '#E2E8F0',  // pressed / active state (slate-200)
        },

        // Borders (neutral only — per AGENTS.md rule: no colorful borders)
        subtle: '#E2E8F0',    // `border-subtle`  slate-200 subtle dividers
        border: {
          subtle: '#E2E8F0',
          default: '#CBD5E1', // slate-300
          strong: '#94A3B8',  // slate-400
        },

        // Text / Ink (crisp slate hierarchy)
        ink: {
          DEFAULT: '#1E293B',   // body text  (`text-ink`, slate-800)
          secondary: '#64748B', // labels, meta (slate-500)
          tertiary: '#94A3B8',  // placeholders, hints (slate-400)
          inverse: '#FFFFFF',   // white text on dark bg
        },

        // BRAND_MODEL palette — Deep Navy (#102D71) + Gold (#DDAD01) active accent
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          600: '#1D4ED8',
          700: '#153A8A',
          800: '#0B2054',
          900: '#102D71',  // main brand accent (`bg-brand-900`, `text-brand-900`)
        },
        action: {
          DEFAULT: '#102D71',
          hover: '#0B2054',
          soft: '#EFF6FF',
        },
        navy: {
          DEFAULT: '#102D71',
          deep: '#0B2054',
        },
        gold: '#DDAD01',

        // Status — clean semantic fills/text (borders remain neutral subtle)
        status: {
          green: '#059669',
          'green-bg': '#059669',
          amber: '#D97706',
          'amber-bg': '#D97706',
          red: '#DC2626',
          'red-bg': '#DC2626',
          blue: '#102D71',
          'blue-bg': '#102D71',
        },
      },

      // ── Typography (Astryx Neutral Figtree + Khmer stack) ─────────────
      fontFamily: {
        sans: ['Figtree', 'Inter', 'Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Figtree', 'Inter', 'Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Figtree', 'Inter', 'Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Inter Tight', 'ui-monospace', 'SF Mono', 'Cascadia Code', 'monospace'],
        khmer: ['Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'Battambang Local', 'Figtree', 'Inter', 'sans-serif'],
      },

      // ── Border Radius ─────────────────────────────────────────────────
      borderRadius: {
        sm: '4px',   // `rounded-sm`
        DEFAULT: '6px', // `--radius-inner` (0.375rem)
        md: '6px',   // `rounded-md`
        lg: '10px',  // `rounded-lg` (`--radius-element`: 0.625rem)
        xl: '12px',  // `rounded-xl` (`--radius-container`: 0.75rem)
        full: '9999px',
      },

      // ── Box Shadow (Astryx Neutral elevation) ─────────────────────────
      boxShadow: {
        card: '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.06)',
        menu: '0 2px 4px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.10)',
        modal: '0 4px 6px rgba(0,0,0,0.10), 0 12px 24px rgba(0,0,0,0.15)',
        header: '0 1px 3px rgba(0,0,0,0.05)',
        focus: '0 0 0 2px #1B1B1B',
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
