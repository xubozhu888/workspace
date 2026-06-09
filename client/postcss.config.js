import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
// Import the config object directly (ESM resolves this relative to THIS file,
// not the cwd) and hand it to Tailwind, so it works no matter where the dev
// server is launched from.
import tailwindConfig from "./tailwind.config.js";

export default {
  plugins: [tailwindcss(tailwindConfig), autoprefixer],
};
