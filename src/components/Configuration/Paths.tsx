import React from "react";
import Button from "react-bootstrap/Button";
import { FolderPlus, FolderMinus } from "react-bootstrap-icons";

import { reorder } from "./Reorder";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface PathsProps {
  paths: string[];
  onRemovePath: (path: string) => void;
  onAddPath: () => void;
  onReorderPaths: (paths: string[]) => void;
}

export const Paths: React.FC<PathsProps> = ({
  paths,
  onRemovePath,
  onAddPath,
  onReorderPaths,
}) => {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    onReorderPaths(reorder(paths, result.source.index, result.destination.index));
  }
  return (
    <>
      <p className="mb-0">Paths to watch for git worktrees:</p>
      {(paths.length === 0 && (
        <p className="fst-italic fs-6">No paths configured!</p>
      )) || (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable-paths">
              {(provided, _snapshot) => (
                <ul className="fw-light list-unstyled"
                  {...provided.droppableProps}
                  ref={provided.innerRef}>
                  {paths.map((path, index) => (
                    <Draggable key={path} draggableId={path} index={index}>
                      {(provided, _snapshot) => (
                        <li className="clearfix mb-1" key={index}
                          ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}                        >
                          {path}
                          <Button
                            className="float-end"
                            variant="danger"
                            size="sm"
                            onClick={() => onRemovePath(path)}
                          >
                            <FolderMinus /> Remove
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
        <Button
          className="float-end"
          variant="primary"
          size="sm"
          onClick={onAddPath}
        >
          <FolderPlus /> Add path
        </Button>
      </div>
    </>
  );
};
