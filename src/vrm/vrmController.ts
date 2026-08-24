import { MathUtils } from "three";
import type { NormalizedLandmark, PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export type VrmLike = { humanoid: { getNormalizedBoneNode(name: string): { rotation: { z: number; y: number; x: number } } | null }; update(delta: number): void };

type BonePair = { bone: string; from: number; to: number };
const armBones: BonePair[] = [
  { bone: "leftUpperArm", from: 11, to: 13 }, { bone: "leftLowerArm", from: 13, to: 15 },
  { bone: "rightUpperArm", from: 12, to: 14 }, { bone: "rightLowerArm", from: 14, to: 16 },
  { bone: "leftUpperLeg", from: 23, to: 25 }, { bone: "leftLowerLeg", from: 25, to: 27 },
  { bone: "rightUpperLeg", from: 24, to: 26 }, { bone: "rightLowerLeg", from: 26, to: 28 },
];

export function applyPoseToVrm(vrm: VrmLike, result: PoseLandmarkerResult, smoothing: number): void {
  const landmarks = result.landmarks[0];
  if (!landmarks) return;
  for (const item of armBones) {
    const bone = vrm.humanoid.getNormalizedBoneNode(item.bone as never);
    const from = landmarks[item.from]; const to = landmarks[item.to];
    if (!bone || !from || !to) continue;
    const target = Math.atan2(to.y - from.y, to.x - from.x);
    const current = bone.rotation.z;
    bone.rotation.z = MathUtils.lerp(current, target, smoothing);
  }
  const head = vrm.humanoid.getNormalizedBoneNode("head");
  const nose = landmarks[0]; const leftShoulder = landmarks[11]; const rightShoulder = landmarks[12];
  if (head && nose && leftShoulder && rightShoulder) {
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    head.rotation.y = MathUtils.lerp(head.rotation.y, (shoulderMidX - nose.x) * 1.8, smoothing);
    head.rotation.z = MathUtils.lerp(head.rotation.z, (nose.x - shoulderMidX) * 1.1, smoothing);
    head.rotation.x = MathUtils.lerp(head.rotation.x, (shoulderMidY - nose.y) * 1.1, smoothing);
  }
}

export function landmarkVisibility(landmark: NormalizedLandmark | undefined): number {
  return landmark?.visibility ?? 0;
}
