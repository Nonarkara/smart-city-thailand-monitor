/**
 * AI Vision Pipeline Service — Stub
 *
 * Architecture ready for real camera connections. When CCTV feeds become
 * available, this service orchestrates:
 *
 * 1. Frame capture: RTSP/MJPEG → image buffer
 *    - `rtsp-ffmpeg` or `node-rtsp-stream` for RTSP → frame extraction
 *    - `fluent-ffmpeg` for video format conversion
 *
 * 2. Vehicle detection: YOLOv8 via ONNX Runtime
 *    - `onnxruntime-node` — run YOLOv8 .onnx model in Node.js
 *    - GitHub: https://github.com/AndreyGermanov/yolov8_onnx_nodejs
 *    - Detects: car, pickup, van, bus, truck, motorcycle
 *
 * 3. License plate recognition: OpenALPR or Plate Recognizer
 *    - OpenALPR Docker: https://github.com/openalpr/openalpr
 *    - Plate Recognizer: https://platerecognizer.com/ (Thai plates supported)
 *    - Self-hosted Docker container for privacy
 *
 * 4. Crowd / incident detection:
 *    - TensorFlow.js for people counting
 *    - Custom incident-sense model for congestion, accidents
 *    - DeepCamera all-in-one: https://github.com/SharpAI/DeepCamera
 *
 * Recommended production stack (budget):
 *   YOLOv8 ONNX (Node.js) + OpenALPR Docker + node-rtsp-stream
 *
 * Recommended production stack (performance):
 *   OpenVINO Model Server (Docker) + Plate Recognizer Stream + rtsp-ffmpeg
 *
 * To connect a real camera:
 *   1. Set rtspUrl or mjpegUrl on the VisionPipelineConfig
 *   2. Change status from "waiting-camera" to "active"
 *   3. The processFrame() function below will be called on each interval
 *   4. Results are stored in the vision_detections table (Supabase when ready)
 */

import { store } from "../data/store.js";

export function getVisionPipelines() {
  return store.getVisionPipelines();
}

export function getVisionResults(cameraId?: string, limit?: number) {
  return store.getVisionResults({ camera: cameraId, limit });
}

/**
 * Process a single frame from a camera.
 * TODO: Connect real inference when cameras are available.
 *
 * @param _cameraId - Camera identifier
 * @param _frameBuffer - JPEG/PNG image buffer (unused in stub)
 * @returns Mock detection result
 */
export function processFrame(_cameraId: string, _frameBuffer?: Buffer) {
  // TODO: Connect real inference
  // 1. Load ONNX model: const session = await ort.InferenceSession.create("yolov8n.onnx")
  // 2. Preprocess frame: resize to 640x640, normalize, create tensor
  // 3. Run inference: const results = await session.run({ images: inputTensor })
  // 4. Post-process: NMS, filter by confidence threshold
  // 5. For LPR: crop detected vehicle regions, send to OpenALPR API
  // 6. Store results in vision_detections table
  return {
    status: "stub" as const,
    message: "Vision pipeline ready — waiting for camera feed connection"
  };
}
