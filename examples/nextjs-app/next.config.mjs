import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // pnpm workspace: trace files from repo root (avoids wrong root when parent dirs have other lockfiles)
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
