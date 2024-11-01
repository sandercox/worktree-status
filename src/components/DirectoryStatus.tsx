import React from "react";
import { Worktree } from "./Worktree";

import { DirectoryResult } from "../types";
import { WorktreeStatusContext } from "../contexts/WorktreeStatusContext";
interface DirectoryStatusProps {
  basepath: string;
}

export const DirectoryStatus: React.FC<DirectoryStatusProps> = ({
  basepath,
}) => {
  const [worktrees, setWorktrees] = React.useState<DirectoryResult[]>([]);

  const worktreeContext = React.useContext(WorktreeStatusContext);
  React.useEffect(() => {
    let stillActive = true;
    async function scan_directory(basepath: string) {
      const result = await worktreeContext.scan_directory(basepath);
      if (stillActive) setWorktrees(result);
    }
    scan_directory(basepath);
    return () => {
      stillActive = false;
    };
  }, [basepath]);
  return (
    <div>
      {worktrees.map((worktree, index) => (
        <Worktree key={index} {...worktree} />
      ))}
    </div>
  );
};

export default DirectoryStatus;
