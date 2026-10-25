import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      intlayer: path.join(root, "src/shim/intlayer.ts"),
      "react-intlayer": path.join(root, "src/shim/react-intlayer.tsx"),
    },
  },
});
