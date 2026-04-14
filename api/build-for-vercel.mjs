/**
 * Pre-builds the API serverless function using esbuild.
 * Creates a fully self-contained ESM bundle with a require shim
 * so bundled CJS modules (Express, etc.) work correctly.
 *
 * Run from repo root: node api/build-for-vercel.mjs
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

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
  // Inject require + __dirname/__filename shims so bundled CJS modules (e.g. connect-pg-simple) work in ESM context
  banner: {
    js: [
      `import { createRequire as __cjsRequire } from "module";`,
      `import { fileURLToPath as __fileURLToPath } from "url";`,
      `import { dirname as __pathDirname } from "path";`,
      `const require = __cjsRequire(import.meta.url);`,
      `const __filename = __fileURLToPath(import.meta.url);`,
      `const __dirname = __pathDirname(__filename);`,
    ].join("\n"),
  },
  external: [
    "*.node",
    "pg-native",
    "cpu-features",
    "ssh2",
    "fsevents",
    "canvas",
    "sharp",
  ],
  tsconfig: path.join(__dirname, "tsconfig.json"),
  logLevel: "info",
  minify: false,
});

console.log("✅ API bundle built → api/handler.mjs");
