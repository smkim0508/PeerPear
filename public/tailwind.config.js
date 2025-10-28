/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'pear': {
                    1: '#5f8f28',
                    2: '#d7f90c',
                    3: '#c3dd90',
                    4: '#393D3F',
                    5: '#EBECE4'
                },
            },
        },
    },
    plugins: [],
}