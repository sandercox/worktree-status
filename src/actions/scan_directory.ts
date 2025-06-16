import { invoke } from "@tauri-apps/api/core";
import { DirectoryResult } from "../types";

export async function scan_directory(basepath: string, filter: string | null) {
  return (await invoke("scan_directory", {
    path: basepath,
    filter: filter,
  })) as DirectoryResult[];
}
