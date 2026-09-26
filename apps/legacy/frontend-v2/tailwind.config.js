/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      keyframes: {
        'progress-bar': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'progress-bar-dynamic': {
          '0%': { width: '0%'},
          '100%': { width: '100%'}
        }
      },
      animation: {
        'progress-bar-5s' : 'progress-bar 5s linear forwards',
        'progress-bar-10s': 'progress-bar 10s linear forwards',
        'progress-bar-15s': 'progress-bar 15s linear forwards',
        'progress-bar-20s': 'progress-bar 20s linear forwards',
        'progress-bar-25s': 'progress-bar 25s linear forwards',
        'progress-bar-30s': 'progress-bar 30s linear forwards',
        'progress-bar-dynamic-voice': 'progress-bar-dynamic var(--duration) linear forwards'
      },
      colors: {
        'white-2':  '#F5F5F5',
        'white-3':  '#EAEAEA',
        'gray-1':   '#1e2939',
        'gray-2':   '#101828',
        'gray-3':   '#030712',
        'success2': '#81C784',
        'lightblue': {
          600: '#4099ff',
          500: '#1a85ff',
          400: '#0d7fee'
        },
        'lightred': {
          600: '#FF5370',
          500: '#ff2d50',
          400: '#ff2046'
        },
        'lightgreen': {
          600: '#2ed8b6',
          500: '#23bd9e',
          400: '#21b295'
        },
       'lightyellow': {
          600: '#ffb64d',
          500: '#ffa627',
          400: '#ffa11a'
        },
        'lightgray': {
          600: '#6c757d',
          500: '#5a6268',
          400: '#545b62'
        },


        'darkblue': {
          600: '#4099ff',
          500: '#1a85ff'
        },
      }
    },
  },
  plugins: [],
};
