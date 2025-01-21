import { invoke } from "@tauri-apps/api/core";

export async function launch_app(appPath: string, args: string | null, worktreePath: string) {
  await invoke("launch_app", { appPath, arguments: args, worktreePath });
}
