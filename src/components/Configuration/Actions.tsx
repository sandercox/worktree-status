import React from "react";
import Button from "react-bootstrap/Button";
import { Action } from "../../types/Action";
import { Gear } from "react-bootstrap-icons";

interface ActionsProps {
  actions: Action[];
  onAddAction: () => void;
  onEditAction: (action: Action) => void;
  onRemoveAction: (action: Action) => void;
  urlForIcon?: (icon: string) => string;
}

export const Actions: React.FC<ActionsProps> = ({
  actions,
  onAddAction,
  onEditAction,
  onRemoveAction,
  urlForIcon,
}) => {
  return (
    <>
      <p className="mb-0">Quick actions for worktrees:</p>
      {(actions.length === 0 && (
        <p className="fst-italic fs-6">No paths configured!</p>
      )) || (
        <ul className="fw-light list-unstyled">
          {actions.map((action, index) => (
            <li className="clearfix mb-1" key={index}>
              {urlForIcon && (
                <img
                  className="me-1"
                  style={{ maxWidth: "1em", maxHeight: "1em" }}
                  src={urlForIcon(action.icon)}
                />
              )}
              {action.name}
              <Button
                className="float-end"
                variant="danger"
                size="sm"
                onClick={() => onRemoveAction(action)}
              >
                Remove
              </Button>
              <Button
                className="float-end"
                variant="outline-secondary"
                size="sm"
                onClick={() => onEditAction(action)}
              >
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="clearfix">
        <Button
          className="float-end"
          variant="primary"
          size="sm"
          onClick={() => onAddAction()}
        >
          <Gear /> Add Action
        </Button>
      </div>
    </>
  );
};
