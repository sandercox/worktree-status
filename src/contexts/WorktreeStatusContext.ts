import React from "react";
import { DirectoryResult, BranchState } from "../types";

interface WorktreeStatusContextType {
  seed: number;
  scan_directory: (
    path: string,
    filter: string | null
  ) => Promise<DirectoryResult[]>;
  get_branch_state: (path: string) => Promise<BranchState | null>;
}

export const WorktreeStatusContext =
  React.createContext<WorktreeStatusContextType>({
    seed: 0,
    scan_directory: async (_path: string) => {
      return [];
    },
    get_branch_state: async (_path: string) => {
      return null;
    },
  });
