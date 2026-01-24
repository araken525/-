/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // ★ここを 'tailwindcss' から変更しました
    autoprefixer: {},
  },
};

export default config;