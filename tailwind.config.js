/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        panel: 'var(--bg-panel)',
        node: 'var(--bg-node)',
        
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          4: 'var(--surface-4)',
        },
        
        state: {
          success: 'var(--state-success)',
          warning: 'var(--state-warning)',
          error: 'var(--state-error)',
          running: 'var(--state-running)',
        },

        accent: {
          lime: 'var(--accent-lime)',
          'blue-frame': 'var(--accent-blue-frame)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          hairline: 'var(--border-hairline)',
          defined: 'var(--border-defined)',
        },
        text: {
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
        danger: 'var(--danger)',
      },
      boxShadow: {
        'elev-node': 'var(--elev-node)',
        'elev-node-selected': 'var(--elev-node-selected)',
        'elev-floating': 'var(--elev-floating)',
      },
      zIndex: {
        0: '0',
        1: '1',
        2: '2',
        3: '3',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        60: '60',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      }
    },
  },
  plugins: [],
}
