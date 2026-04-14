/**
 * Pre-builds the API serverless function using esbuild.
 * Bypasses TypeScript strict type-checking issues and produces
 * a single ESM bundle for Vercel serverless functions.
 *
 * Run from repo root: node api/build-for-vercel.mjs
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// Use esbuild from api-server's node_modules (always available after pnpm install)
const require = createRequire(import.meta.url);
const { build } = require(
  path.join(repoRoot, "artifacts/api-server/node_modules/esbuild")
);

await build({
  entryPoints: [path.join(__dirname, "index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: path.join(repoRoot, "api-built", "index.mjs"),
  packages: "external",
  tsconfig: path.join(__dirname, "tsconfig.json"),
  logLevel: "info",
});

console.log("✅ API bundle built → api-built/index.mjs");
