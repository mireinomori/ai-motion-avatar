"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, Quaternion, Vector3 } from "three";
import type { Group, Mesh } from "three";
import type { NormalizedLandmark, PoseLandmarkerResult } from "@mediapipe/tasks-vision";


type AvatarViewerProps = { resultRef: React.MutableRefObject<PoseLandmarkerResult | null> };
type JointName = "head" | "leftShoulder" | "leftElbow" | "leftWrist" | "rightShoulder" | "rightElbow" | "rightWrist" | "leftHip" | "leftKnee" | "leftAnkle" | "rightHip" | "rightKnee" | "rightAnkle";

const indices: Record<JointName, number> = {
  head: 0, leftShoulder: 11, leftElbow: 13, leftWrist: 15, rightShoulder: 12, rightElbow: 14, rightWrist: 16,
  leftHip: 23, leftKnee: 25, leftAnkle: 27, rightHip: 24, rightKnee: 26, rightAnkle: 28,
};
const links: ReadonlyArray<readonly [JointName, JointName]> = [
  ["head", "leftShoulder"], ["head", "rightShoulder"], ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"], ["leftElbow", "leftWrist"], ["rightShoulder", "rightElbow"], ["rightElbow", "rightWrist"],
  ["leftShoulder", "leftHip"], ["rightShoulder", "rightHip"], ["leftHip", "rightHip"], ["leftHip", "leftKnee"], ["leftKnee", "leftAnkle"], ["rightHip", "rightKnee"], ["rightKnee", "rightAnkle"],
];

export function AvatarViewer({ resultRef, vrmUrl, smoothing, onVrmError }: AvatarViewerProps & { vrmUrl: string | null; smoothing: number; onVrmError: (message: string) => void }) {
  void vrmUrl; void smoothing; void onVrmError;
  return <Canvas className="avatar-canvas" camera={{ position: [0, 0, 8], fov: 32 }} dpr={[1, 1.5]}><ambientLight intensity={1.7} /><pointLight position={[3, 4, 5]} intensity={10} color="#b4f38a" /><pointLight position={[-4, 2, 3]} intensity={8} color="#9ce8e8" /><TrackedAvatar resultRef={resultRef} /></Canvas>;
}

function TrackedAvatar({ resultRef }: AvatarViewerProps) {
  const rootRef = useRef<Group>(null);
  const jointRefs = useRef<Partial<Record<JointName, Group>>>({});
  const boneRefs = useRef<Array<Mesh | null>>([]);
  const scratchStart = useRef(new Vector3());
  const scratchEnd = useRef(new Vector3());
  const scratchMid = useRef(new Vector3());
  const scratchQuaternion = useRef(new Quaternion());

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    const landmarks = resultRef.current?.landmarks[0];
    if (!landmarks) {
      root.scale.lerp(new Vector3(0.85, 0.85, 0.85), 0.04);
      return;
    }
    root.scale.lerp(new Vector3(1, 1, 1), 0.08);
    const positions = new Map<JointName, Vector3>();
    for (const [name, index] of Object.entries(indices) as Array<[JointName, number]>) {
      const landmark = landmarks[index];
      if (!landmark || (landmark.visibility ?? 1) < 0.35) continue;
      const position = toAvatarPosition(landmark);
      positions.set(name, position);
      jointRefs.current[name]?.position.lerp(position, 0.22);
    }
    const start = scratchStart.current;
    const end = scratchEnd.current;
    const mid = scratchMid.current;
    const quaternion = scratchQuaternion.current;
    links.forEach(([from, to], index) => {
      const a = positions.get(from); const b = positions.get(to); const bone = boneRefs.current[index];
      if (!a || !b || !bone) return;
      start.copy(a); end.copy(b); mid.copy(a).add(b).multiplyScalar(0.5);
      bone.position.copy(mid);
      const length = start.distanceTo(end);
      bone.scale.y = Math.max(0.01, length);
      quaternion.setFromUnitVectors(new Vector3(0, 1, 0), end.clone().sub(start).normalize());
      bone.quaternion.slerp(quaternion, 0.25);
    });
  });

  return <group ref={rootRef} position={[0, -0.3, 0]}>
    {Object.keys(indices).map((name) => <group key={name} ref={(node: Group | null) => { if (node) jointRefs.current[name as JointName] = node; }}><mesh><sphereGeometry args={[name === "head" ? 0.22 : 0.1, 16, 12]} /><meshStandardMaterial color={name === "head" ? "#b4f38a" : "#9ce8e8"} emissive={new Color(name === "head" ? "#6d9d58" : "#387b7f")} emissiveIntensity={0.5} /></mesh></group>)}
    {links.map((_, index) => <mesh key={index} ref={(node: Mesh | null) => { boneRefs.current[index] = node; }}><cylinderGeometry args={[0.045, 0.045, 1, 10]} /><meshStandardMaterial color="#d7f7cf" emissive="#567c51" emissiveIntensity={0.4} /></mesh>)}
  </group>;
}

function toAvatarPosition(landmark: NormalizedLandmark) {
  return new Vector3(-(landmark.x - 0.5) * 4.3, (0.58 - landmark.y) * 4.3, -landmark.z * 1.2);
}
