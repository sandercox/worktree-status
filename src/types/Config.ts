import { Action } from "./Action";
import { WorktreePath } from "./WorktreePath";

export interface Config {
  paths: WorktreePath[];
  actions: Action[];
}
