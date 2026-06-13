import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const imagesDir = path.join(__dirname, "images");
const uploadsDir = path.join(__dirname, "uploads");
const uploadsIndexPath = path.join(uploadsDir, "index.json");
const videosDir = path.join(__dirname, "videos");
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
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".webm", "video/webm"]
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

function extensionFromResponse(url, contentType, fallback = ".png") {
  const byType = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm"
  };
  const type = String(contentType || "").split(";")[0].toLowerCase();
  if (byType[type]) return byType[type];

  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (mimeTypes.has(ext)) return ext;
  } catch {
    // Fall through to a conservative default.
  }
  return fallback;
}

function extensionFromMimeType(contentType, fallback = ".png") {
  const type = String(contentType || "").split(";")[0].toLowerCase();
  const byType = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg"
  };
  return byType[type] || fallback;
}

function parseDataUri(value) {
  const match = String(value || "").match(/^data:([^;,]+)(;base64)?,(.*)$/);
  if (!match) {
    throw new Error("Invalid image data");
  }

  const mimeType = match[1].toLowerCase();
  if (!mimeType.startsWith("image/")) {
    throw new Error("Only image uploads are supported");
  }

  const data = match[3] || "";
  const bytes = match[2] ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data), "utf8");
  if (!bytes.length) {
    throw new Error("Uploaded image is empty");
  }
  if (bytes.length > 20 * 1024 * 1024) {
    throw new Error("Uploaded image must be 20 MB or smaller");
  }

  return { bytes, mimeType };
}

async function uploadImageToApimart({ bytes, mimeType, filename, authorization }) {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType }), filename);

  const upstream = await fetch(`${apiBase}/v1/uploads/images`, {
    method: "POST",
    headers: { Authorization: authorization },
    body: form
  });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok || payload.error) {
    throw new Error(payload?.error?.message || payload?.message || `APIMart upload failed: HTTP ${upstream.status}`);
  }
  if (!payload.url) {
    throw new Error("APIMart upload response did not include url");
  }

  return payload;
}

async function readUploadsIndex() {
  try {
    const records = JSON.parse(await readFile(uploadsIndexPath, "utf8"));
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

async function writeUploadsIndex(records) {
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(uploadsIndexPath, JSON.stringify(records.slice(0, 500), null, 2));
}

function collectTaskImageUrls(task) {
  return (task?.result?.images || []).flatMap((item) => item?.url || []);
}

function collectTaskVideoUrls(task) {
  const videos = (task?.result?.videos || []).flatMap((item) => {
    if (typeof item === "string") return item;
    return item?.url || [];
  });
  const visit = (value) => {
    if (!value) return;
    if (typeof value === "string") {
      if (/^https?:\/\//i.test(value) && /\.(mp4|mov|webm)(\?|$)/i.test(value)) {
        videos.push(value);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  };

  visit(task?.result);
  return [...new Set(videos)];
}

async function downloadFiles(taskId, urls, { directory, urlPrefix, label, fallbackName }) {
  await mkdir(directory, { recursive: true });
  const safeTaskId = safeName(taskId, "task");
  const saved = [];

  for (const [index, fileUrl] of urls.entries()) {
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download ${label} ${index + 1}: HTTP ${fileResponse.status}`);
    }

    const bytes = Buffer.from(await fileResponse.arrayBuffer());
    const ext = extensionFromResponse(fileUrl, fileResponse.headers.get("content-type"), fallbackName);
    const filename = `${safeTaskId}-${String(index + 1).padStart(2, "0")}${ext}`;
    await writeFile(path.join(directory, filename), bytes);
    saved.push({
      original_url: fileUrl,
      filename,
      url: `${urlPrefix}/${encodeURIComponent(filename)}`,
      size: bytes.length
    });
    console.log(`Saved generated ${label}: ${urlPrefix.slice(1)}/${filename}`);
  }

  return saved;
}

async function downloadImages(taskId, images) {
  return downloadFiles(taskId, images, {
    directory: imagesDir,
    urlPrefix: "/images",
    label: "image",
    fallbackName: ".png"
  });
}

async function downloadVideos(taskId, videos) {
  return downloadFiles(taskId, videos, {
    directory: videosDir,
    urlPrefix: "/videos",
    label: "video",
    fallbackName: ".mp4"
  });
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

async function saveGeneratedVideos(request, response) {
  try {
    const payload = await readRequestJson(request);
    const videos = Array.isArray(payload.videos) ? payload.videos.filter(Boolean) : [];
    console.log(`Video save requested: task=${payload.task_id || "unknown"}, count=${videos.length}`);
    if (!videos.length) {
      sendJson(response, 400, { error: "videos must be a non-empty array" });
      return;
    }

    const saved = await downloadVideos(payload.task_id, videos);
    sendJson(response, 200, { videos: saved });
  } catch (error) {
    console.error(error?.message || "Failed to save videos");
    sendJson(response, 500, { error: error?.message || "Failed to save videos" });
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
    const videos = collectTaskVideoUrls(task);
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
    if (task.status === "completed" && videos.length) {
      console.log(`Completed video task queried: ${task.id || taskId}; saving ${videos.length} video(s)`);
      try {
        const saved = await downloadVideos(task.id || taskId, videos);
        task.local_videos = saved.map((item) => item.url);
      } catch (error) {
        const message = error?.message || "Failed to save videos locally";
        console.error(`Failed to save completed video task ${task.id || taskId}: ${message}`);
        task.local_video_save_error = message;
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

async function uploadImages(request, response) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization) {
      sendJson(response, 401, { error: { message: "Missing Authorization header" } });
      return;
    }

    const payload = await readRequestJson(request);
    const images = Array.isArray(payload.images) ? payload.images : [];
    if (!images.length) {
      sendJson(response, 400, { error: "images must be a non-empty array" });
      return;
    }

    await mkdir(uploadsDir, { recursive: true });
    const saved = [];
    const now = Date.now();

    for (const [index, item] of images.entries()) {
      const { bytes, mimeType } = parseDataUri(item?.data);
      const ext = extensionFromMimeType(item?.type || mimeType, path.extname(item?.name || "") || ".png");
      if (!mimeTypes.has(ext.toLowerCase()) || !mimeTypes.get(ext.toLowerCase())?.startsWith("image/")) {
        throw new Error("Unsupported image type");
      }

      const baseName = safeName(path.basename(item?.name || `upload-${index + 1}`, path.extname(item?.name || "")), "upload");
      const filename = `${now}-${String(index + 1).padStart(2, "0")}-${randomUUID().slice(0, 8)}-${baseName}${ext}`;
      await writeFile(path.join(uploadsDir, filename), bytes);
      const upstream = await uploadImageToApimart({
        bytes,
        mimeType,
        filename: item?.name || filename,
        authorization
      });
      saved.push({
        filename,
        original_name: item?.name || filename,
        type: mimeType,
        size: bytes.length,
        uploaded_at: now,
        url: upstream.url,
        api_url: upstream.url,
        local_url: `/uploads/${encodeURIComponent(filename)}`,
        expires_at: upstream.expires_at || null
      });
    }

    const history = await readUploadsIndex();
    await writeUploadsIndex([...saved, ...history]);
    sendJson(response, 200, { images: saved });
  } catch (error) {
    console.error(error?.message || "Failed to upload images");
    sendJson(response, 500, { error: error?.message || "Failed to upload images" });
  }
}

async function listUploadedImages(response) {
  try {
    await mkdir(uploadsDir, { recursive: true });
    const indexed = await readUploadsIndex();
    if (indexed.length) {
      sendJson(response, 200, { images: indexed });
      return;
    }

    const entries = await readdir(uploadsDir, { withFileTypes: true });
    const images = await Promise.all(
      entries
        .filter((entry) => {
          const ext = path.extname(entry.name).toLowerCase();
          return entry.isFile() && mimeTypes.has(ext) && mimeTypes.get(ext)?.startsWith("image/");
        })
        .map(async (entry) => {
          const filePath = path.join(uploadsDir, entry.name);
          const fileStat = await stat(filePath);
          return {
            filename: entry.name,
            original_name: entry.name.replace(/^\d+-\d+-[a-f0-9]+-/i, ""),
            size: fileStat.size,
            uploaded_at: fileStat.mtimeMs,
            url: `/uploads/${encodeURIComponent(entry.name)}`,
            local_url: `/uploads/${encodeURIComponent(entry.name)}`
          };
        })
    );
    images.sort((a, b) => b.uploaded_at - a.uploaded_at);
    sendJson(response, 200, { images });
  } catch (error) {
    sendJson(response, 500, { error: error?.message || "Failed to list uploads" });
  }
}

async function listSavedVideos(response) {
  try {
    await mkdir(videosDir, { recursive: true });
    const entries = await readdir(videosDir, { withFileTypes: true });
    const videos = entries
      .filter((entry) => entry.isFile() && [".mp4", ".mov", ".webm"].includes(path.extname(entry.name).toLowerCase()))
      .map((entry) => ({
        filename: entry.name,
        url: `/videos/${encodeURIComponent(entry.name)}`
      }))
      .sort((a, b) => b.filename.localeCompare(a.filename));
    sendJson(response, 200, { videos });
  } catch (error) {
    sendJson(response, 500, { error: error?.message || "Failed to list videos" });
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "POST" && url.pathname === "/api/images/save") {
    await saveGeneratedImages(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/videos/save") {
    await saveGeneratedVideos(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/uploads") {
    await uploadImages(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/images") {
    await listSavedImages(response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/uploads") {
    await listUploadedImages(response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/videos") {
    await listSavedVideos(response);
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

  if (url.pathname.startsWith("/uploads/")) {
    await serveStatic(response, url, uploadsDir, "/uploads");
    return;
  }

  if (url.pathname.startsWith("/videos/")) {
    await serveStatic(response, url, videosDir, "/videos");
    return;
  }

  await serveStatic(response, url);
});

server.listen(port, () => {
  console.log(`GPT-Image-2 console is running at http://localhost:${port}`);
});
