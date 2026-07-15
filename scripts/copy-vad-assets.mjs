import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vadSource = path.join(root, "node_modules", "@ricky0123", "vad-web", "dist");
const ortSource = path.join(root, "node_modules", "onnxruntime-web", "dist");
const vadTarget = path.join(root, "public", "vad");
const generatedTarget = path.join(root, "src", "generated", "vad");

await Promise.all([
  mkdir(vadTarget, { recursive: true }),
  mkdir(generatedTarget, { recursive: true }),
]);

for (const name of ["silero_vad_v5.onnx", "vad.worklet.bundle.min.js"]) {
  await copyFile(path.join(vadSource, name), path.join(vadTarget, name));
}

for (const name of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  await copyFile(path.join(ortSource, name), path.join(generatedTarget, name));
}
