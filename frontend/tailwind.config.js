export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Color Emoji', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: '#5865F2',
        secondary: '#6D767E',
        background: '#FFFFFF',
        'discord-dark': '#313338',
        'discord-darker': '#2B2D31',
        'discord-darkest': '#1E1F22',
        'discord-light': '#F2F3F5',
        'custom-sidebar': '#121214',
        'custom-card': '#242429',
        'custom-bg': '#1A1A1E',
        'accessible-orange': '#E69F00',
        'accessible-blue': '#0072B2',
        'accessible-green': '#009E73',
        'accessible-yellow': '#F0E442',
        'accessible-purple': '#CC79A7',
        'accessible-red': '#D55E00',
        'accessible-pink': '#CC79A7',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'smooth': '300ms',
      },
    },
  },
  plugins: [],
}
