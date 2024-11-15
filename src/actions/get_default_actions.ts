import { invoke } from "@tauri-apps/api/core";
import { Action } from "../types";

export async function get_default_actions(): Promise<Action[]> {
  return (await invoke("get_default_actions")) as Action[];
}
