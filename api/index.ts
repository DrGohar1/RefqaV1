/**
   * Vercel Serverless Function — Rafaqaa API
   *
   * This file is the entry point for ALL /api/* requests on Vercel.
   * Vercel detects this file, compiles it with @vercel/node, and serves it as a serverless function.
   *
   * The Express app (artifacts/api-server/src/app.ts) is imported directly.
   * pnpm workspace packages (@workspace/db, etc.) are resolved via the workspace symlinks.
   */

  import app from "../artifacts/api-server/src/app";

  export default app;
  