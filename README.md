# AI Motion Avatar

PCまたはスマートフォンのカメラ映像から人物の動きを検出し、ブラウザ内の3Dキャラクターへ反映する無料・ローカル優先のWebアプリです。

## 現在の実装

MVP 1-4として、カメラの開始・停止、前面/背面切替、左右反転表示、レスポンシブ画面、エラー表示、MediaPipe Pose Landmarkerによる主要関節と骨格線の表示、Three.js/React Three Fiberによる簡易3Dキャラクター連動、ローカルVRM読み込みと主要ボーン連動を実装しています。

## 使用技術

Next.js / React / TypeScript / MediaPipe Tasks Vision / Three.js / React Three Fiber / `@pixiv/three-vrm`（予定）

すべて無料で利用できるOSSまたは標準Web APIを前提とし、OpenAI API、Gemini API、クラウド画像認識API、従量課金APIは使用しません。

## 起動方法

```bash
npm install
npm run dev
```

`http://localhost:3000`を開いてください。スマートフォンから試す場合は、HTTPS環境またはlocalhost経由でカメラ権限を許可してください。

## プライバシー

カメラ映像は原則として端末内で処理され、外部サーバーには送信されません。人物画像・顔画像・動画は保存しません。顔認証も行いません。MediaPipeの無料WASMと公式Poseモデルはプロジェクトへ同梱し、公開先自身から読み込みます。カメラ映像や骨格データは送信しません。

## VRM変更方法

ライセンスが明確でないモデルは同梱しません。ユーザーがローカルの`.vrm`ファイルを選択し、ブラウザ内だけで読み込みます。50MBのサイズ上限と拡張子を検査し、Object URLは使用後に解放します。

## 無料・通信確認表

| 項目 | 使用技術 | 費用 | 外部通信 |
| --- | --- | --- | --- |
| 姿勢推定 | MediaPipe Tasks Vision | 無料 | 公開先の`/mediapipe`から取得。外部CDNなし |
| 3D表示 | Three.js | 無料 | 原則なし |
| VRM | `@pixiv/three-vrm` | 無料 | 原則なし |
| モーション保存 | JSON / File API | 無料 | なし |
| カメラ | Web MediaDevices API | 無料 | なし |

このアプリを動作させるために、料金が発生するサービスへの契約・登録は不要です。依存パッケージの追加時には、ライセンス、保守状況、外部通信、脆弱性を確認します。

## 今後の拡張

MVP 3: 簡易キャラクター / MVP 4-5: VRM全身連動 / MVP 6: モーション録画・JSON保存・再生 / スマートフォン最適化 / `npm audit`確認
