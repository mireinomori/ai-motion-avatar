export const MAX_VRM_FILE_SIZE = 50 * 1024 * 1024;

export function validateVrmFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".vrm")) return "VRMファイル（.vrm）を選択してください。";
  if (file.size > MAX_VRM_FILE_SIZE) return "VRMファイルは50MB以下にしてください。";
  if (file.size === 0) return "空のVRMファイルは読み込めません。";
  return null;
}
