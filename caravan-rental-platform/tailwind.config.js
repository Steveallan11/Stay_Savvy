/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Holiday Horizons Color Palette
        'sunset-orange': {
          light: '#FFB399',
          DEFAULT: '#FF7F50',
          dark: '#E65A2B'
        },
        'sea-blue': {
          light: '#7DB3F0',
          DEFAULT: '#4A90E2',
          dark: '#2E5A87'
        },
        'warm-sand': {
          light: '#FAF2E8',
          DEFAULT: '#F5E6D3',
          dark: '#E8D4BC'
        },
        // Neutrals
        'charcoal': '#2C3E50',
        'slate-gray': '#64748B',
        'light-gray': '#F1F5F9',
        // Semantic colors
        'success-green': '#10B981',
        'warning-amber': '#F59E0B',
        'error-red': '#EF4444',
        'info-blue': '#3B82F6',
        // Dark mode
        'dark': {
          primary: '#1A202C',
          secondary: '#2D3748',
          card: '#374151',
          text: {
            primary: '#F7FAFC',
            secondary: '#E2E8F0'
          },
          border: '#4A5568'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1-mobile': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'h1-desktop': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'h2-mobile': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'h2-desktop': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'h3-mobile': ['1.25rem', { lineHeight: '1.4' }],
        'h3-desktop': ['1.75rem', { lineHeight: '1.4' }],
        'h4': ['1.125rem', { lineHeight: '1.4' }],
        'body-mobile': ['1rem', { lineHeight: '1.6' }],
        'body-desktop': ['1.125rem', { lineHeight: '1.6' }],
        'small': ['0.875rem', { lineHeight: '1.5' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'glass-hover': '0 12px 40px rgba(31, 38, 135, 0.45)',
        'level-1': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'level-2': '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
        'level-3': '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
        'level-4': '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}