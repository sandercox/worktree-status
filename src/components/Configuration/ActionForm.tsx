import React from "react";
import { Action } from "../../types";

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

interface ActionFormProps {
  action: Action | null;
  onUpdate: (action: Action) => void;
  onBrowsePath: (oldPath: string | undefined | null) => Promise<string | null>;
  onBrowseIcon: (oldIcon: string | undefined | null) => Promise<string | null>;
}

export const ActionForm: React.FC<ActionFormProps> = ({
  action,
  onUpdate,
  onBrowsePath,
  onBrowseIcon,
}) => {
  return (
    <>
      <Form>
        <Form.Group className="mb-3" controlId="action.name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            value={(action !== null && action.name) || ""}
            onChange={(e) =>
              onUpdate({ path: "", icon: "", ...action, name: e.target.value })
            }
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="action.action">
          <Form.Label>Action</Form.Label>
          <div className="d-flex align-items-center">
            <Form.Control
              type="text"
              value={(action !== null && action.path) || ""}
              onChange={(e) =>
                onUpdate({
                  icon: "",
                  name: "",
                  ...action,
                  path: e.target.value,
                })
              }
            />
            <Button
              variant="secondary"
              onClick={() =>
                onBrowsePath(action?.path).then(
                  (path) =>
                    path !== null &&
                    onUpdate({ icon: "", name: "", ...action, path: path })
                )
              }
            >
              Browse
            </Button>
          </div>
        </Form.Group>
        <Form.Group className="mb-3" controlId="action.icon">
          <Form.Label>Icon</Form.Label>
          <div className="d-flex align-items-center">
            <Form.Control
              type="text"
              value={(action !== null && action.icon) || ""}
              onChange={(e) =>
                onUpdate({
                  path: "",
                  name: "",
                  ...action,
                  icon: e.target.value,
                })
              }
            />
            <Button
              variant="secondary"
              onClick={() =>
                onBrowseIcon(action?.icon).then(
                  (icon) =>
                    icon !== null &&
                    onUpdate({ path: "", name: "", ...action, icon: icon })
                )
              }
            >
              Browse
            </Button>
          </div>
        </Form.Group>
        <Form.Group className="mb-3" controlId="action.arguments">
          <Form.Label>Arguments</Form.Label>
          <div className="d-flex align-items-center">
            <Form.Control
              type="text"
              value={(action !== null && action.arguments) || ""}
              onChange={(e) =>
                onUpdate({
                  icon: "",
                  name: "",
                  path: "",
                  ...action,
                  arguments: e.target.value === "" ? null : e.target.value,
                })
              }
            />
          </div>
          <div className="hint">
            <pre>{"{folder}"}</pre> will be replaced by worktree-path
          </div>
        </Form.Group>
      </Form>
    </>
  );
};
