import React from "react";
import { Paths } from "./Paths";
import { Actions } from "./Actions";
import Button from "react-bootstrap/Button";
import { Config, Action } from "../../types";
import { ActionModal } from "./ActionModal";

export interface ConfigurationProps {
  config: Config;
  onAddPath: () => void;
  onRemovePath: (path: string) => void;
  onAddAction: (action: Action) => void;
  onRemoveAction: (action: Action) => void;
  onUpdateAction: (old: Action, updated: Action) => void;
  onBrowseActionPath: (oldPath: string | undefined) => Promise<string | null>;
  onBrowseActionIcon: (oldIcon: string | undefined) => Promise<string | null>;
  urlForIcon?: (icon: string) => string;

  onStore?: () => void;
}

export const Configuration: React.FC<ConfigurationProps> = ({
  config,
  onAddPath,
  onRemovePath,
  onStore,

  onAddAction,
  onRemoveAction,
  onUpdateAction,
  onBrowseActionPath,
  onBrowseActionIcon,
  urlForIcon,
}) => {
  const [showActionModal, setShowActionModal] = React.useState(false);
  const [modalAction, setModalAction] = React.useState<
    Action | null | undefined
  >(undefined);
  const addAction = () => {
    console.log("Add action!");
    setModalAction(null);
    setShowActionModal(true);
  };

  const editAction = (action: Action) => {
    setModalAction(action);
    setShowActionModal(true);
  };

  return (
    <div id="config" className="clearfix p-3 mb-4">
      <h1>Configuration</h1>
      <Paths
        paths={config.paths}
        onAddPath={onAddPath}
        onRemovePath={(path) => onRemovePath(path)}
      />
      <Actions
        actions={config.actions}
        onAddAction={() => addAction()}
        onEditAction={(action) => editAction(action)}
        onRemoveAction={(action) => onRemoveAction(action)}
        urlForIcon={urlForIcon}
      />
      {onStore && (
        <div className="text-center mt-3">
          <Button size="sm" variant="secondary" onClick={onStore}>
            Save Configuration
          </Button>
        </div>
      )}
      <ActionModal
        action={showActionModal ? modalAction : undefined}
        onCancel={() => setShowActionModal(false)}
        onBrowsePath={onBrowseActionPath}
        onBrowseIcon={onBrowseActionIcon}
        onSubmit={(action) => {
          if (modalAction) {
            onUpdateAction(modalAction, {
              ...action,
              icon: action.icon === "" ? null : action.icon,
            });
          } else {
            onAddAction({
              ...action,
              icon: action.icon === "" ? null : action.icon,
            });
          }
          setShowActionModal(false);
        }}
      />
    </div>
  );
};
