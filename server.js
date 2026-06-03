import { createReadStream } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const imagesDir = path.join(__dirname, "images");
const apiBase = "https://api.apimart.ai";
const port = Number(globalThis.process?.env?.PORT || 3000);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(text);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function serveStatic(response, url, rootDir = publicDir, urlPrefix = "") {
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const relativePath = urlPrefix && requestedPath.startsWith(urlPrefix)
    ? requestedPath.slice(urlPrefix.length)
    : requestedPath;
  const filePath = path.resolve(rootDir, `.${relativePath}`);

  if (!isInside(rootDir, filePath)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
      "Content-Length": fileStat.size,
      "Cache-Control": "no-cache"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    sendText(response, 404, "Not found");
  }
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024 * 1024) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function safeName(value, fallback = "image") {
  return String(value || fallback)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || fallback;
}

function extensionFromResponse(url, contentType) {
  const byType = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif"
  };
  const type = String(contentType || "").split(";")[0].toLowerCase();
  if (byType[type]) return byType[type];

  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (mimeTypes.has(ext)) return ext;
  } catch {
    // Fall through to a conservative default.
  }
  return ".png";
}

function collectTaskImageUrls(task) {
  return (task?.result?.images || []).flatMap((item) => item?.url || []);
}

async function downloadImages(taskId, images) {
  await mkdir(imagesDir, { recursive: true });
  const safeTaskId = safeName(taskId, "task");
  const saved = [];

  for (const [index, imageUrl] of images.entries()) {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image ${index + 1}: HTTP ${imageResponse.status}`);
    }

    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    const ext = extensionFromResponse(imageUrl, imageResponse.headers.get("content-type"));
    const filename = `${safeTaskId}-${String(index + 1).padStart(2, "0")}${ext}`;
    await writeFile(path.join(imagesDir, filename), bytes);
    saved.push({
      original_url: imageUrl,
      filename,
      url: `/images/${encodeURIComponent(filename)}`,
      size: bytes.length
    });
    console.log(`Saved generated image: images/${filename}`);
  }

  return saved;
}

async function saveGeneratedImages(request, response) {
  try {
    const payload = await readRequestJson(request);
    const images = Array.isArray(payload.images) ? payload.images.filter(Boolean) : [];
    console.log(`Image save requested: task=${payload.task_id || "unknown"}, count=${images.length}`);
    if (!images.length) {
      sendJson(response, 400, { error: "images must be a non-empty array" });
      return;
    }

    const saved = await downloadImages(payload.task_id, images);
    sendJson(response, 200, { images: saved });
  } catch (error) {
    console.error(error?.message || "Failed to save images");
    sendJson(response, 500, { error: error?.message || "Failed to save images" });
  }
}

async function proxyTaskQuery(request, response, taskId) {
  try {
    const authorization = request.headers.authorization;
    console.log(`Proxy task query: task=${taskId}, auth=${authorization ? "present" : "missing"}`);
    if (!authorization) {
      sendJson(response, 401, { error: { message: "Missing Authorization header" } });
      return;
    }

    const upstream = await fetch(`${apiBase}/v1/tasks/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: authorization }
    });
    const payload = await upstream.json().catch(() => ({}));
    console.log(`APIMart task query response: task=${taskId}, status=${upstream.status}, ok=${upstream.ok}`);
    if (!upstream.ok || payload.error) {
      sendJson(response, upstream.status || 500, payload.error ? payload : { error: { message: `HTTP ${upstream.status}` } });
      return;
    }

    const task = payload.data || {};
    const images = collectTaskImageUrls(task);
    if (task.status === "completed" && images.length) {
      console.log(`Completed task queried: ${task.id || taskId}; saving ${images.length} image(s)`);
      try {
        const saved = await downloadImages(task.id || taskId, images);
        task.local_images = saved.map((item) => item.url);
        task.result.images = (task.result.images || []).map((item, index) => ({
          ...item,
          local_url: saved[index]?.url || item.local_url
        }));
      } catch (error) {
        const message = error?.message || "Failed to save images locally";
        console.error(`Failed to save completed task ${task.id || taskId}: ${message}`);
        task.local_save_error = message;
      }
    }

    sendJson(response, 200, payload);
  } catch (error) {
    console.error(`Proxy task query failed: task=${taskId}, error=${error?.message || "Failed to query task"}`);
    sendJson(response, 500, { error: { message: error?.message || "Failed to query task" } });
  }
}

async function listSavedImages(response) {
  try {
    await mkdir(imagesDir, { recursive: true });
    const entries = await readdir(imagesDir, { withFileTypes: true });
    const images = entries
      .filter((entry) => entry.isFile() && mimeTypes.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => ({
        filename: entry.name,
        url: `/images/${encodeURIComponent(entry.name)}`
      }))
      .sort((a, b) => b.filename.localeCompare(a.filename));
    sendJson(response, 200, { images });
  } catch (error) {
    sendJson(response, 500, { error: error?.message || "Failed to list images" });
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "POST" && url.pathname === "/api/images/save") {
    await saveGeneratedImages(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/images") {
    await listSavedImages(response);
    return;
  }

  const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (request.method === "GET" && taskMatch) {
    await proxyTaskQuery(request, response, decodeURIComponent(taskMatch[1]));
    return;
  }

  if (request.method !== "GET") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  if (url.pathname.startsWith("/images/")) {
    await serveStatic(response, url, imagesDir, "/images");
    return;
  }

  await serveStatic(response, url);
});

server.listen(port, () => {
  console.log(`GPT-Image-2 console is running at http://localhost:${port}`);
});
