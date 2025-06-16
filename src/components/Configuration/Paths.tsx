import React from "react";
import Button from "react-bootstrap/Button";
import { FolderPlus, FolderMinus, Gear, Save, XCircleFill } from "react-bootstrap-icons";
import { WorktreePath, Setting } from "../../types";
import { reorder } from "./Reorder";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Settings } from "./Settings";

interface PathsProps {
  paths: WorktreePath[];
  onRemovePath: (key: string) => void;
  onAddPath: () => void;
  onReorderPaths: (paths: WorktreePath[]) => void;
  onUpdatePath: (path: WorktreePath) => void;
}

const WorktreePathConfig: React.FC<{
  path: WorktreePath, onRemovePath: (key: string) => void,
  onUpdatePath: (path: WorktreePath) => void
}> = ({ path, onRemovePath, onUpdatePath }) => {
  const [showConfig, setShowConfig] = React.useState(false);
  const [settings, setSettings] = React.useState<Setting[]>([]);

  React.useEffect(
    () => {
      setSettings([
        {
          key: `path-${path.key}-displayName`,
          displayName: "Display Name",
          type: "string",
          value: path.displayName || "",
        },
        {
          key: `path-${path.key}-filter`,
          displayName: "Filter",
          type: "string",
          value: path.filter || "",
        },
        {
          key: `path-${path.key}-defaultCollapse`,
          displayName: "Default Collapse",
          type: "bool",
          value: path.defaultCollapse ? "true" : "false",
        },
      ]);
    }, [path]
  );

  return (
    <>
      <span>
        {path.displayName && (<>{path.displayName} - <span className="font-italic text-muted" style={{ fontSize: ".825em" }}>{path.path}</span></>) || path.path}
      </span>
      <div className="float-end">
        <Gear onClick={() => setShowConfig(!showConfig)} style={{ cursor: "pointer" }} />
      </div>
      {showConfig && (
        <>

          <Settings settings={settings} onUpdateSettings={(newSettings) => { setSettings(newSettings) }} />
          <Button
            variant="danger"
            size="sm"
            onClick={() => onRemovePath(path.key)}
          >
            <FolderMinus /> Remove
          </Button>
          <div className="float-end">

            <Button
              variant="primary"
              size="sm"
              className="me-2"
              onClick={() => { setShowConfig(false); }}
            >
              <XCircleFill /> Close
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                setShowConfig(false);
                onUpdatePath({
                  ...path,
                  displayName: settings.find(s => s.key === `path-${path.key}-displayName`)?.value || null,
                  filter: settings.find(s => s.key === `path-${path.key}-filter`)?.value || null,
                  defaultCollapse: settings.find(s => s.key === `path-${path.key}-defaultCollapse`)?.value === "true",
                })
              }}
            >
              <Save /> Save
            </Button>
          </div>

        </>
      )}
    </>
  );
}

export const Paths: React.FC<PathsProps> = ({
  paths,
  onRemovePath,
  onAddPath,
  onReorderPaths,
  onUpdatePath,
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
                    <Draggable key={path.key} draggableId={path.key} index={index}>
                      {(provided, _snapshot) => (
                        <li className="clearfix mb-1" key={index}
                          ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}                        >
                          <WorktreePathConfig path={path} onRemovePath={onRemovePath} onUpdatePath={onUpdatePath} />
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
