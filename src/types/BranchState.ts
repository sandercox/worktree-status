export interface BranchState {
  branch: string;
  ahead: number;
  behind: number;

  staged: number;
  added: number;
  modified: number;
  deleted: number;
  untracked: number;
  conflict: number;
}

export default BranchState;
