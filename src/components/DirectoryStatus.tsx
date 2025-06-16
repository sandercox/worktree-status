import React from "react";
import { Worktree } from "./Worktree";

import { DirectoryResult, WorktreePath } from "../types";
import { WorktreeStatusContext } from "../contexts/WorktreeStatusContext";
interface DirectoryStatusProps {
  worktreePath: WorktreePath;
}

export const DirectoryStatus: React.FC<DirectoryStatusProps> = ({
  worktreePath,
}) => {
  const [worktrees, setWorktrees] = React.useState<DirectoryResult[]>([]);

  const worktreeContext = React.useContext(WorktreeStatusContext);
  React.useEffect(() => {
    let stillActive = true;
    async function scan_directory(basepath: string, filter: string | null) {
      const result = await worktreeContext.scan_directory(basepath, filter);
      if (stillActive) setWorktrees(result);
    }
    scan_directory(worktreePath.path, worktreePath.filter);
    return () => {
      stillActive = false;
    };
  }, [worktreePath]);
  return (
    <div>
      {worktrees.map((worktree, index) => (
        <Worktree key={worktreePath.key + "-" + index} {...worktree} />
      ))}
    </div>
  );
};

export default DirectoryStatus;
