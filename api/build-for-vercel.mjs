/**
 * Pre-builds the API serverless function using esbuild.
 * Overwrites api/handler.mjs with a fully bundled ESM file
 * that Vercel can deploy as a serverless function.
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
  outfile: path.join(__dirname, "handler.mjs"),
  packages: "external",
  tsconfig: path.join(__dirname, "tsconfig.json"),
  logLevel: "info",
});

console.log("✅ API bundle built → api/handler.mjs");
