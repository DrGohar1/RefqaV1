/**
   * Vercel Serverless Function — Diagnostic wrapper
   */

  let app: any;
  let initError: any;

  try {
    const mod = await import("../artifacts/api-server/src/app");
    app = mod.default;
  } catch (err) {
    initError = err;
  }

  export default function handler(req: any, res: any) {
    if (initError) {
      res.status(500).json({
        error: "App init failed",
        message: String(initError?.message || initError),
        stack: String(initError?.stack || "").slice(0, 500),
      });
      return;
    }
    return app(req, res);
  }
  