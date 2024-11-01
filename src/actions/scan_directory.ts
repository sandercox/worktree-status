import { invoke } from "@tauri-apps/api/core";
import { DirectoryResult } from "../types";

export async function scan_directory(basepath: string) {
  return (await invoke("scan_directory", {
    path: basepath,
  })) as DirectoryResult[];
}
