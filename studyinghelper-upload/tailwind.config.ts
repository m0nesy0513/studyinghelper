import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "'PingFang SC'", "'Microsoft YaHei'", "'Noto Sans SC'", 'system-ui', '-apple-system', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Cascadia Code'", "'Fira Code'", "'Consolas'", "'Courier New'", 'monospace'],
      },
      colors: {
        background: '#020617',
        surface: 'rgba(15, 23, 42, 0.6)',
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.12)',
          active: 'rgba(139, 92, 246, 0.3)',
        },
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        input: '10px',
      },
      animation: {
        'shimmer': 'shimmer 0.6s ease-out forwards',
        'gradient-shift': 'gradient-shift 4s ease-in-out infinite alternate',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
