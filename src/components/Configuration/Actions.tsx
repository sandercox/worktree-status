import React from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import { Action } from "../../types/Action";
import { Gear } from "react-bootstrap-icons";

import { reorder } from "./Reorder";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";



interface ActionsProps {
  actions: Action[];
  systemActions: Action[];
  onAddAction: (action: Action | null) => void;
  onEditAction: (action: Action) => void;
  onRemoveAction: (action: Action) => void;
  onReorderAction: (actions: Action[]) => void;
  urlForIcon?: (icon: string) => string;
}

export const Actions: React.FC<ActionsProps> = ({
  actions,
  systemActions,
  onAddAction,
  onEditAction,
  onRemoveAction,
  onReorderAction,
  urlForIcon,
}) => {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    onReorderAction(reorder(actions, result.source.index, result.destination.index));
  };
  return (
    <>
      <p className="mb-0">Quick actions for worktrees:</p>
      {(actions.length === 0 && (
        <p className="fst-italic fs-6">No paths configured!</p>
      )) || (

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable-actions">
              {(provided, _snapshot) => (
                <ul className="fw-light list-unstyled"
                  {...provided.droppableProps}
                  ref={provided.innerRef}>
                  {actions.map((action, index) => (
                    <Draggable key={action.name} draggableId={action.name} index={index}>
                      {(provided, _snapshot) => (
                        <li className="clearfix mb-1" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>

          </DragDropContext>
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
