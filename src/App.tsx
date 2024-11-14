import React from "react";
import { Header } from "./components/Header";

// Tauri imports
import { open } from "@tauri-apps/plugin-dialog";
import { Store, load } from "@tauri-apps/plugin-store";
import { convertFileSrc } from "@tauri-apps/api/core";

// Components
import { Gear } from "react-bootstrap-icons";
import Accordion from "react-bootstrap/Accordion";

import { DirectoryStatus } from "./components/DirectoryStatus";
import { Configuration } from "./components/Configuration";

// Types
import { Config } from "./types";

// Contexts
import { ActionContext } from "./contexts/ActionContext";
import { WorktreeStatusContext } from "./contexts/WorktreeStatusContext";

// Actions
import { scan_directory } from "./actions/scan_directory";
import { get_branch_state } from "./actions/get_branch_state";
import { launch_app } from "./actions/launch_app";
import { hide_on_focus_lost } from "./actions/hide_on_focus_lost";

// Stylesheets
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.scss";

function App() {
  const [showConfig, setShowConfig] = React.useState(false);
  const [config, setConfig] = React.useState<Config>({
    paths: [],
    actions: [],
  });

  const [store, setStore] = React.useState<Store | null>(null);

  React.useEffect(() => {
    async function initStore() {
      const newStore = await load("worktree-status", undefined);
      newStore.get<Config>("config").then((c) => {
        if (
          c === null ||
          c === undefined ||
          c.paths === undefined ||
          c.actions === undefined
        )
          c = undefined;
        setConfig(
          c || {
            paths: [],
            actions: [
              {
                name: "VS Code",
                path: "c:\\Program Files\\code.exe",
                icon: "vscode.png",
              },
              {
                name: "Explorer",
                path: "explorer.exe",
                icon: "explorer.png",
              },
            ],
          }
        );
        if (c === null || c === undefined || c.paths.length === 0)
          setShowConfig(true);
      });
      setStore(newStore);
    }
    initStore();
  }, []);

  async function addPath() {
    await hide_on_focus_lost(false);
    const selected = await open({
      multiple: false,
      directory: true,
      title: "Select folder that contains subfolders with git worktrees",
    });
    await hide_on_focus_lost(true);
    if (selected !== null)
      setConfig({ ...config, paths: [...config.paths, selected] });
  }
  function removePath(path: string) {
    setConfig({ ...config, paths: config.paths.filter((v) => v !== path) });
  }

  async function browsePath(oldPath: string | undefined | null) {
    await hide_on_focus_lost(false);
    const selected = await open({
      multiple: false,
      directory: false,
      defaultPath: oldPath ?? undefined,
      title: "Select the action object to execute",
    });
    await hide_on_focus_lost(true);
    return selected;
  }
  async function browseIcon(oldIcon: string | undefined | null) {
    await hide_on_focus_lost(false);
    const selected = await open({
      multiple: false,
      directory: false,
      defaultPath: oldIcon ?? undefined,
      title: "Select icon for the action",
    });
    await hide_on_focus_lost(true);
    return selected;
  }

  function urlForIcon(icon: string) {
    if (icon.startsWith("http://") || icon.startsWith("https://")) return icon;

    return convertFileSrc(icon, "worktree-status");
  }

  return (
    <>
      <Header>
        Worktree Status
        <Gear
          className="float-end me-2 "
          style={{ cursor: "hand", fontSize: "1.2em" }}
          onClick={() => setShowConfig(!showConfig)}
        />
      </Header>
      {showConfig && (
        <Configuration
          config={config}
          onAddPath={addPath}
          onRemovePath={(path) => removePath(path)}
          onAddAction={(action) => {
            setConfig({ ...config, actions: [...config.actions, action] });
          }}
          onUpdateAction={(oldAction, newAction) => {
            setConfig({
              ...config,
              actions: config.actions.map((a) =>
                a === oldAction ? { ...a, ...newAction } : a
              ),
            });
          }}
          onRemoveAction={(action) => {
            setConfig({
              ...config,
              actions: config.actions.filter((a) => a !== action),
            });
          }}
          onBrowseActionPath={async (oldPath) => browsePath(oldPath)}
          onBrowseActionIcon={async (oldIcon) => browseIcon(oldIcon)}
          urlForIcon={urlForIcon}
          onStore={
            store
              ? () =>
                  store &&
                  store
                    .set("config", config)
                    .then(() => store.save())
                    .then(() => setShowConfig(false))
              : undefined
          }
        />
      )}
      {config !== null && config.paths.length !== 0 && (
        <WorktreeStatusContext.Provider
          value={{
            scan_directory: scan_directory,
            get_branch_state: get_branch_state,
          }}
        >
          <ActionContext.Provider
            value={{
              actions: config.actions,
              onAction: (action, path) => {
                launch_app(action.path, path);
              },
              urlForIcon: urlForIcon,
            }}
          >
            <div className="font-sans">
              <Accordion
                defaultActiveKey={config.paths.map((_path, index) =>
                  index.toString()
                )}
                alwaysOpen
              >
                {config !== null &&
                  config.paths.map((path, index) => (
                    <Accordion.Item key={index} eventKey={index.toString()}>
                      <Accordion.Header className="font-serif">
                        {path}
                      </Accordion.Header>
                      <Accordion.Body>
                        <DirectoryStatus key={index} basepath={path} />
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
              </Accordion>
            </div>
          </ActionContext.Provider>
        </WorktreeStatusContext.Provider>
      )}
    </>
  );
}

export default App;
