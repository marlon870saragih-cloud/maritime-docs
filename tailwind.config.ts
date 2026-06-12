import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A1628',
        ink2: '#0F1E36',
        ink3: '#152843',
        line: '#1F3556',
        line2: '#2A4470',
        paper: '#F5F1E8',
        paperdim: '#C9C0AA',
        mute: '#7B8FA8',
        signal: '#F4C430',
        port: '#D32841',
        good: '#4FB286',
        warn: '#E8923A',
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
