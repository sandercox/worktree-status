import { invoke } from "@tauri-apps/api/core";

export async function hide_on_focus_lost(new_state: boolean): Promise<boolean> {
  return (await invoke("hide_on_focus_lost", {
    newState: new_state,
  })) as boolean;
}
