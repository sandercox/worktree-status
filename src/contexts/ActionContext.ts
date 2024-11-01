import React from "react";
import { Action } from "../types";
interface ActionContextType {
  actions: Action[];
  onAction: (action: Action, worktreePath: string) => void;
  urlForIcon?: (icon: string) => string;
}

export const ActionContext = React.createContext<ActionContextType>({
  actions: [],
  onAction: (_action: Action, _worktreePath: string) => {},
  urlForIcon: (icon: string) => {
    return icon;
  },
});
