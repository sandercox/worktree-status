import React from "react";

import { Shortcut } from "./Shortcut";
import { ActionContext } from "../contexts/ActionContext";

interface ActionsProps {
  path: string;
}

export const Actions: React.FC<ActionsProps> = ({ path }) => {
  const actionContext = React.useContext(ActionContext);

  return (
    <>
      {actionContext.actions.map((action, index) => (
        <Shortcut
          key={index}
          {...action}
          onClick={() => {
            actionContext.onAction(action, path);
          }}
        />
      ))}
    </>
  );
};
