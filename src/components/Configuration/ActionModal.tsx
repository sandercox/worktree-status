import React from "react";
import { Action } from "../../types/Action";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

import { ActionForm } from "./ActionForm";

interface ActionModalProps {
  action: Action | null | undefined;
  onCancel: () => void;
  onSubmit: (action: Action) => void;
  onBrowsePath: (oldPath: string | undefined | null) => Promise<string | null>;
  onBrowseIcon: (oldIcon: string | undefined | null) => Promise<string | null>;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  action,
  onCancel,
  onSubmit,
  onBrowsePath,
  onBrowseIcon,
}) => {
  const [displayAction, setDisplayAction] = React.useState<Action | null>(null);
  React.useEffect(() => {
    if (action === undefined) setDisplayAction(null);
    else setDisplayAction(action);
  }, [action]);
  return (
    <Modal show={action !== undefined} onHide={() => onCancel()}>
      <Modal.Header>
        <Modal.Title>{action !== null ? "Edit" : "Add"} Action</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ActionForm
          action={displayAction}
          onUpdate={(action) => setDisplayAction(action)}
          onBrowsePath={onBrowsePath}
          onBrowseIcon={onBrowseIcon}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => onCancel()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={displayAction === null}
          onClick={() => displayAction !== null && onSubmit(displayAction)}
        >
          {action !== null ? "Edit" : "Add"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
