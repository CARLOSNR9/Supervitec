import type { Config } from "tailwindcss";

const config: Config = {
  // ✅ CORRECCIÓN: Se cambió ["class"] por "class"
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
export default config;