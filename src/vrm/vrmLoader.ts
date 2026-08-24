import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Object3D } from "three";
import type { VrmLike } from "@/vrm/vrmController";

export async function loadVrmFromUrl(url: string): Promise<VrmLike & { scene: Object3D }> {
  const { VRMLoaderPlugin } = await import("@pixiv/three-vrm");
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const gltf = await loader.loadAsync(url);
  if (!gltf.userData.vrm) throw new Error("VRMデータが見つかりません。");
  return gltf.userData.vrm as VrmLike & { scene: Object3D };
}
