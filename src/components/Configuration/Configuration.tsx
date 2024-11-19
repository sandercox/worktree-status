import React from "react";
import { Paths } from "./Paths";
import { Actions } from "./Actions";
import Button from "react-bootstrap/Button";
import { Config, Action, Setting } from "../../types";
import { ActionModal } from "./ActionModal";
import { Settings } from "./Settings";

export interface ConfigurationProps {
  config: Config;
  systemActions: Action[];
  version: string | null;
  settings: Setting[];
  onAddPath: () => void;
  onRemovePath: (path: string) => void;
  onAddAction: (action: Action) => void;
  onRemoveAction: (action: Action) => void;
  onUpdateAction: (old: Action, updated: Action) => void;
  onBrowseActionPath: (
    oldPath: string | undefined | null
  ) => Promise<string | null>;
  onBrowseActionIcon: (
    oldIcon: string | undefined | null
  ) => Promise<string | null>;
  urlForIcon?: (icon: string) => string;
  onUpdateSettings: (settings: Setting[]) => void;

  onStore?: () => void;
}

export const Configuration: React.FC<ConfigurationProps> = ({
  config,
  systemActions,
  version,
  settings,
  onAddPath,
  onRemovePath,
  onStore,

  onAddAction,
  onRemoveAction,
  onUpdateAction,
  onBrowseActionPath,
  onBrowseActionIcon,
  urlForIcon,
  onUpdateSettings,
}) => {
  const [showActionModal, setShowActionModal] = React.useState(false);
  const [modalAction, setModalAction] = React.useState<
    Action | null | undefined
  >(undefined);
  const addAction = (action: Action | null) => {
    if (action !== null) {
      onAddAction({
        ...action,
        icon: action.icon === "" ? null : action.icon,
      });
      return;
    }
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
        systemActions={systemActions}
        onAddAction={(action) => addAction(action)}
        onEditAction={(action) => editAction(action)}
        onRemoveAction={(action) => onRemoveAction(action)}
        urlForIcon={urlForIcon}
      />
      <Settings
        settings={settings}
        onUpdateSettings={(s) => onUpdateSettings(s)} />
      <div className="clearfix">
        {version && <p className="version float-end">v{version}</p>}
        {onStore && (
          <div className="text-center mt-3">
            <Button size="sm" variant="secondary" onClick={onStore}>
              Save Configuration
            </Button>
          </div>
        )}
      </div>
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
