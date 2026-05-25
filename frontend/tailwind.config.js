/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f8fafc',
        surface: {
          DEFAULT: '#ffffff',
          dim: '#f1f5f9',
          container: '#f0ecf9',
          'container-low': '#f5f2ff',
          'container-high': '#eae6f4',
        },
        primary: {
          DEFAULT: '#4f46e5',
          dark: '#3525cd',
          light: '#e2dfff',
          muted: '#c3c0ff',
        },
        secondary: {
          DEFAULT: '#58579b',
          light: '#b6b4ff',
        },
        tcp: {
          DEFAULT: '#0ea5e9',
          light: '#e0f2fe',
          dark: '#0284c7',
        },
        udp: {
          DEFAULT: '#8b5cf6',
          light: '#ede9fe',
          dark: '#7c3aed',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
        },
        border: {
          glass: 'rgba(226, 232, 240, 0.8)',
          subtle: '#e2e8f0',
        },
        text: {
          primary: '#1e293b',
          secondary: '#64748b',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'label': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em', fontWeight: '600' }],
        'data': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'glass-hover': '0 4px 12px rgba(79, 70, 229, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 25px rgba(79, 70, 229, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
        'glow-primary': '0 0 20px rgba(79, 70, 229, 0.3)',
        'glow-tcp': '0 0 15px rgba(14, 165, 233, 0.3)',
        'glow-udp': '0 0 15px rgba(139, 92, 246, 0.3)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.3)',
        'glow-danger': '0 0 15px rgba(239, 68, 68, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up-delay-1': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
        'slide-up-delay-2': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both',
        'slide-up-delay-3': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both',
        'fade-in': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
