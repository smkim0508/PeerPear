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
                    1: '#8cbf70',
                    2: '#8cbf70',
                    3: '#8cbf70',
                    4: '#393D3F',
                    5: '#EBECE4'
                },
            },
        },
    },
    plugins: [],
}
