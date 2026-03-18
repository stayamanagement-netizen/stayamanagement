import { createServer } from "http";
import { existsSync } from "fs";
import { readFile, stat } from "fs/promises";
import { resolve, extname, join } from "path";

const PORT = Number(process.env["PORT"]);
if (!PORT) throw new Error("PORT environment variable is required");

// Resolve static files regardless of working directory (dev vs production)
// Dev: pnpm runs from artifacts/api-server/ → go two levels up to monorepo root
// Production: node runs from monorepo root directly
// Dev (cwd = artifacts/api-server/): ../nextjs-app/dist/public
// Production (cwd = monorepo root):   artifacts/nextjs-app/dist/public
const fromRoot = resolve(process.cwd(), "artifacts/nextjs-app/dist/public");
const fromPkg  = resolve(process.cwd(), "../nextjs-app/dist/public");
const PUBLIC_DIR = existsSync(fromRoot) ? fromRoot : fromPkg;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function cacheControl(filePath: string): string {
  if (filePath.includes("/_next/static/")) {
    return "public, max-age=31536000, immutable";
  }
  if (filePath.endsWith(".html")) {
    return "no-cache, no-store, must-revalidate";
  }
  return "public, max-age=3600";
}

createServer(async (req, res) => {
  const pathname = (req.url ?? "/").split("?")[0];

  const candidates = [
    join(PUBLIC_DIR, pathname),
    join(PUBLIC_DIR, pathname.replace(/\/$/, ""), "index.html"),
    join(PUBLIC_DIR, "404.html"),
  ];

  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (!info.isFile()) continue;
      const body = await readFile(candidate);
      const mime = MIME[extname(candidate)] ?? "application/octet-stream";
      const is404 = candidate.endsWith("404.html") && !pathname.endsWith("404.html");
      res.writeHead(is404 ? 404 : 200, {
        "Content-Type": mime,
        "Cache-Control": cacheControl(candidate),
        "X-Content-Type-Options": "nosniff",
      });
      res.end(body);
      return;
    } catch {
      // try next candidate
    }
  }

  res.writeHead(404);
  res.end("Not Found");
}).listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
