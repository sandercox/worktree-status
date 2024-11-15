import React from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import { Action } from "../../types/Action";
import { Gear } from "react-bootstrap-icons";

interface ActionsProps {
  actions: Action[];
  systemActions: Action[];
  onAddAction: (action: Action | null) => void;
  onEditAction: (action: Action) => void;
  onRemoveAction: (action: Action) => void;
  urlForIcon?: (icon: string) => string;
}

export const Actions: React.FC<ActionsProps> = ({
  actions,
  systemActions,
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
                  src={urlForIcon(action.icon ?? action.path)}
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
        <Dropdown as={ButtonGroup} className="float-end">
          <Button variant="primary" size="sm" onClick={() => onAddAction(null)}>
            <Gear /> Add Action
          </Button>
          <Dropdown.Toggle split variant="primary" size="sm" />
          <Dropdown.Menu>
            {systemActions.map((action, index) => (
              <Dropdown.Item key={index} onClick={() => onAddAction(action)}>
                {urlForIcon && (
                  <img
                    className="me-1"
                    style={{ maxWidth: "1em", maxHeight: "1em" }}
                    src={urlForIcon(action.icon ?? action.path)}
                  />
                )}{" "}
                {action.name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </>
  );
};
