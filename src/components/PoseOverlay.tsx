"use client";

import { useEffect, useRef } from "react";
import type { NormalizedLandmark, PoseLandmarkerResult } from "@mediapipe/tasks-vision";

const connections: ReadonlyArray<readonly [number, number]> = [
  [0, 11], [0, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32], [27, 29], [28, 30], [29, 31], [30, 32],
];

type PoseOverlayProps = { resultRef: React.MutableRefObject<PoseLandmarkerResult | null>; visible: boolean };

export function PoseOverlay({ resultRef, visible }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      const result = resultRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(rect.width * dpr));
        const height = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const context = canvas.getContext("2d");
        if (context) {
          context.clearRect(0, 0, width, height);
          if (visible && result?.landmarks[0]) drawPose(context, result.landmarks[0], width, height);
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [resultRef, visible]);

  return <canvas ref={canvasRef} className="pose-overlay" aria-hidden="true" />;
}

function drawPose(context: CanvasRenderingContext2D, landmarks: readonly NormalizedLandmark[], width: number, height: number) {
  context.save();
  context.scale(-1, 1);
  context.translate(-width, 0);
  context.strokeStyle = "#b4f38a";
  context.lineWidth = Math.max(2, width / 420);
  context.lineCap = "round";
  for (const [from, to] of connections) {
    const a = landmarks[from];
    const b = landmarks[to];
    if (!a || !b || (a.visibility ?? 1) < 0.35 || (b.visibility ?? 1) < 0.35) continue;
    context.beginPath();
    context.moveTo(a.x * width, a.y * height);
    context.lineTo(b.x * width, b.y * height);
    context.stroke();
  }
  context.fillStyle = "#9ce8e8";
  for (const landmark of landmarks) {
    if ((landmark.visibility ?? 1) < 0.35) continue;
    context.beginPath();
    context.arc(landmark.x * width, landmark.y * height, Math.max(3, width / 160), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
