// Vista local sin dependencias. Ejecutar: node preview.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".png":"image/png", ".webp":"image/webp", ".ico":"image/x-icon" };
const server = http.createServer((req, res) => {
  let file;
  try {
    const requestPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    file = path.resolve(root, "." + (requestPath === "/" ? "/index.html" : requestPath));
    const relative = path.relative(root, file);
    if (relative.startsWith("..") || path.isAbsolute(relative) || !types[path.extname(file).toLowerCase()]) {
      res.writeHead(404); res.end("No encontrado"); return;
    }
  } catch { res.writeHead(400); res.end("Solicitud no válida"); return; }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end("No encontrado"); return; }
    res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()], "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
    const stream = fs.createReadStream(file);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  });
});
server.listen(5500, "127.0.0.1", () => console.log("ATELIER: http://127.0.0.1:5500\nDetener con Ctrl+C."));
server.on("error", err => { console.error(err.code === "EADDRINUSE" ? "El puerto 5500 está ocupado." : err.message); process.exitCode = 1; });

