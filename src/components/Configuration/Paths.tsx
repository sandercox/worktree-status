import React from "react";
import Button from "react-bootstrap/Button";
import { FolderPlus, FolderMinus } from "react-bootstrap-icons";

interface PathsProps {
  paths: string[];
  onRemovePath: (path: string) => void;
  onAddPath: () => void;
}

export const Paths: React.FC<PathsProps> = ({
  paths,
  onRemovePath,
  onAddPath,
}) => {
  return (
    <>
      <p className="mb-0">Paths to watch for git worktrees:</p>
      {(paths.length === 0 && (
        <p className="fst-italic fs-6">No paths configured!</p>
      )) || (
        <ul className="fw-light list-unstyled">
          {paths.map((path, index) => (
            <li className="clearfix mb-1" key={index}>
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
          ))}
        </ul>
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
