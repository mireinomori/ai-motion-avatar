import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export type PoseDetectorStatus = "loading" | "ready" | "error";

export class PoseDetector {
  private landmarker: PoseLandmarker | null = null;
  private lastVideoTime = -1;

  async initialize(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        // 公式の無料モデルをpublicへ同梱し、公開先からローカル取得します。
        modelAssetPath: "/mediapipe/models/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.55,
      minPosePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });
  }

  detect(video: HTMLVideoElement): PoseLandmarkerResult | null {
    if (!this.landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
    if (video.currentTime === this.lastVideoTime) return null;
    this.lastVideoTime = video.currentTime;
    return this.landmarker.detectForVideo(video, performance.now());
  }

  close(): void {
    this.landmarker?.close();
    this.landmarker = null;
    this.lastVideoTime = -1;
  }
}
