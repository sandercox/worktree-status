import { invoke } from "@tauri-apps/api/core";
import { BranchState } from "../types";

export async function get_branch_state(path: string) {
  return (await invoke("get_branch_state", { path })) as BranchState;
}
