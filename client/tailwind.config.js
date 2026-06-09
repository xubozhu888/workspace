import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Resolve content globs relative to THIS file, not the current working
// directory — the dev server may be launched from the repo root (Vite root
// = client), in which case "./src" would point at the wrong place.
const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [join(here, "index.html"), join(here, "src/**/*.{js,jsx}")],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#f0f7f2", 100: "#dcede1", 200: "#bbdcc6",
          300: "#8ec3a1", 400: "#5ba377", 500: "#3b8559",
          600: "#2c6a46", 700: "#245539", 800: "#1e4530",
          900: "#173a28", 950: "#0c2117",
        },
      },
    },
  },
  // Safety net: ensure every pitch color utility exists even if a class name
  // is ever assembled dynamically.
  safelist: [
    { pattern: /(bg|text|border|ring)-pitch-(50|100|200|300|400|500|600|700|800|900|950)/ },
  ],
  plugins: [],
};
