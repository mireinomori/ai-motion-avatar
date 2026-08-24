"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { PoseOverlay } from "@/components/PoseOverlay";
import { PoseDetector } from "@/motion/poseDetector";
import { AvatarViewer } from "@/components/AvatarViewer";
import { validateVrmFile } from "@/vrm/fileValidation";

type CameraFacingMode = "user" | "environment";
type CameraStatus = "stopped" | "starting" | "active" | "error" | "detecting" | "detected" | "not-found";

const statusLabels: Record<CameraStatus, string> = {
  stopped: "カメラ停止中",
  starting: "カメラ起動中",
  active: "カメラ起動中",
  detecting: "人物検出中",
  detected: "人物を検出しました",
  "not-found": "人物が見つかりません",
  error: "カメラエラー",
};

export function MotionAvatarApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("stopped");
  const [facingMode, setFacingMode] = useState<CameraFacingMode>("user");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasStream, setHasStream] = useState(false);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [vrmUrl, setVrmUrl] = useState<string | null>(null);
  const [vrmName, setVrmName] = useState("");
  const [smoothing, setSmoothing] = useState(0.18);
  const poseDetectorRef = useRef<PoseDetector | null>(null);
  const poseResultRef = useRef<PoseLandmarkerResult | null>(null);
  const poseFrameRef = useRef<number | null>(null);
  const lastPoseStatusRef = useRef<CameraStatus>("stopped");

  const stopCamera = useCallback(() => {
    if (poseFrameRef.current !== null) cancelAnimationFrame(poseFrameRef.current);
    poseFrameRef.current = null;
    poseResultRef.current = null;
    poseDetectorRef.current?.close();
    poseDetectorRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setHasStream(false);
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("stopped");
  }, []);

  const startPoseDetection = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      setStatus("detecting");
      const detector = new PoseDetector();
      await detector.initialize();
      poseDetectorRef.current = detector;
      const detect = () => {
        if (!videoRef.current || !poseDetectorRef.current) return;
        const result = poseDetectorRef.current.detect(videoRef.current);
        if (result) {
          poseResultRef.current = result;
          const hasPerson = result.landmarks.length > 0;
          const nextStatus: CameraStatus = hasPerson ? "detected" : "not-found";
          if (lastPoseStatusRef.current !== nextStatus) {
            lastPoseStatusRef.current = nextStatus;
            setStatus(nextStatus);
          }
        }
        poseFrameRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch {
      setStatus("error");
      setErrorMessage("MediaPipeの読み込みに失敗しました。インターネット接続を確認して再試行してください。");
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("このブラウザはカメラに対応していません。HTTPSまたはlocalhostで開いてください。");
      return;
    }
    stopCamera();
    setStatus("starting");
    setErrorMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasStream(true);
      setStatus("active");
      void startPoseDetection();
    } catch (error) {
      setStatus("error");
      const name = error instanceof DOMException ? error.name : "";
      setErrorMessage(name === "NotAllowedError" ? "カメラ使用が拒否されました。ブラウザの設定から許可してください。" : name === "NotFoundError" ? "カメラが見つかりません。カメラを接続して再試行してください。" : "カメラを起動できませんでした。端末のカメラ設定を確認してください。");
    }
  }, [facingMode, startPoseDetection, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode((current) => (current === "user" ? "environment" : "user"));
  }, []);

  const handleVrmChange = useCallback((file: File | undefined) => {
    if (!file) return;
    const validationError = validateVrmFile(file);
    if (validationError) { setErrorMessage(validationError); setStatus("error"); return; }
    const nextUrl = URL.createObjectURL(file);
    setVrmUrl((current) => { if (current) URL.revokeObjectURL(current); return nextUrl; });
    setVrmName(file.name);
    setErrorMessage("");
  }, []);

  useEffect(() => () => { if (vrmUrl) URL.revokeObjectURL(vrmUrl); }, [vrmUrl]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (status === "active") void startCamera();
    // facingMode変更時だけカメラを再取得します。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">LOCAL MOTION CAPTURE</p>
          <h1>AI Motion Avatar</h1>
        </div>
        <div className={`status status-${status}`}><span className="status-dot" />{statusLabels[status]}</div>
      </header>

      <section className="stage-grid" aria-label="カメラとアバターの表示エリア">
        <div className="stage-panel camera-panel">
          <div className="panel-heading"><span>CAMERA VIEW</span><small>端末内処理</small></div>
          <div className="camera-frame">
            <video ref={videoRef} className="camera-video" playsInline muted aria-label="カメラ映像" />
            {!hasStream && <div className="camera-placeholder"><div className="camera-icon">◉</div><p>カメラを開始すると<br />ここに映像が表示されます</p></div>}
            <PoseOverlay resultRef={poseResultRef} visible={showSkeleton} />
          </div>
        </div>
        <div className={`stage-panel avatar-panel ${showAvatar ? "" : "is-hidden"}`}>
          <div className="panel-heading"><span>AVATAR VIEW</span><small>VRM対応予定</small></div>
          <div className="avatar-frame"><AvatarViewer resultRef={poseResultRef} vrmUrl={vrmUrl} smoothing={smoothing} onVrmError={setErrorMessage} /><div className="avatar-label">{vrmName ? vrmName : "MVP 3 / SIMPLE AVATAR"}</div></div>
        </div>
      </section>

      <section className="controls" aria-label="カメラ操作">
        <div className="primary-actions">
          <button className="button button-primary" onClick={() => void startCamera()} disabled={status === "starting"}>カメラ開始</button>
          <button className="button button-secondary" onClick={stopCamera} disabled={status === "stopped"}>カメラ停止</button>
          <button className="button button-secondary" onClick={switchCamera}>前面／背面切替</button>
        </div>
        <div className="toggle-actions">
          <label className="toggle"><input type="checkbox" checked={showAvatar} onChange={(event) => setShowAvatar(event.target.checked)} /><span />キャラクター表示</label>
          <label className="toggle"><input type="checkbox" checked={showSkeleton} onChange={(event) => setShowSkeleton(event.target.checked)} /><span />骨格表示</label>
        </div>
      </section>

      <section className="advanced-controls" aria-label="アバター設定">
        <label className="file-button">VRMを読み込む<input type="file" accept=".vrm,model/vrm" onChange={(event) => handleVrmChange(event.target.files?.[0])} /></label>
        <label className="smooth-control">動きの滑らかさ <input type="range" min="0.06" max="0.5" step="0.01" value={smoothing} onChange={(event) => setSmoothing(Number(event.target.value))} /><span>{Math.round(smoothing * 100)}%</span></label>
      </section>

      <div className="privacy-note"><span>◎</span> カメラ映像は原則として端末内で処理され、外部サーバーには送信されません。</div>
      {errorMessage && <div className="error-banner" role="alert">{errorMessage}</div>}
      <footer className="phase-note">MVP 1 / カメラ映像表示　・　次のステップ：MediaPipe Poseによる骨格検出</footer>
    </main>
  );
}
