import { invoke } from "@tauri-apps/api/core";

export async function launch_app(appPath: string, worktreePath: string) {
  await invoke("launch_app", { appPath, worktreePath });
}
