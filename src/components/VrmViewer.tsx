"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Object3D } from "three";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { loadVrmFromUrl } from "@/vrm/vrmLoader";
import { applyPoseToVrm, type VrmLike } from "@/vrm/vrmController";

type VrmViewerProps = { vrmUrl: string | null; resultRef: React.MutableRefObject<PoseLandmarkerResult | null>; smoothing: number; onError: (message: string) => void };

export function VrmViewer({ vrmUrl, resultRef, smoothing, onError }: VrmViewerProps) {
  const [vrm, setVrm] = useState<(VrmLike & { scene: Object3D }) | null>(null);
  const previousScene = useRef<Object3D | null>(null);

  useEffect(() => {
    let disposed = false;
    if (!vrmUrl) { setVrm(null); return () => { disposed = true; }; }
    void loadVrmFromUrl(vrmUrl).then((loaded) => {
      if (disposed) { loaded.scene.removeFromParent(); return; }
      previousScene.current?.removeFromParent();
      previousScene.current = loaded.scene;
      setVrm(loaded);
    }).catch(() => onError("VRMの読み込みに失敗しました。対応形式のファイルか確認してください。"));
    return () => { disposed = true; };
  }, [onError, vrmUrl]);

  useFrame((_, delta) => {
    if (!vrm) return;
    const result = resultRef.current;
    if (result) applyPoseToVrm(vrm, result, smoothing);
    vrm.update(delta);
  });

  return vrm ? <primitive object={vrm.scene} position={[0, -1.1, 0]} scale={2.6} /> : null;
}
