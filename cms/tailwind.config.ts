import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void:        '#050B17',
        panel:       '#070E1D',
        surface:     '#0C1829',
        lift:        '#102236',
        accent:      '#7B5EF8',
        'accent-light': '#A78BFA',
        cyan:        '#22D3EE',
        green:       '#10B981',
        amber:       '#FBBF24',
        rose:        '#F43F5E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
