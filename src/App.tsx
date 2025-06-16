import React from "react";
import { Header } from "./components/Header";
import { Updater } from "./components/Updater";

// Tauri imports
import { open } from "@tauri-apps/plugin-dialog";
import { Store, load } from "@tauri-apps/plugin-store";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import {
  enable as autostart_enable,
  disable as autostart_disable,
  isEnabled as autostart_is_enabled,
} from "@tauri-apps/plugin-autostart";

// Components
import { Gear } from "react-bootstrap-icons";
import Accordion from "react-bootstrap/Accordion";

import { DirectoryStatus } from "./components/DirectoryStatus";
import { Configuration } from "./components/Configuration";

// Types
import { Action, Config, Setting } from "./types";

// Contexts
import { ActionContext } from "./contexts/ActionContext";
import { WorktreeStatusContext } from "./contexts/WorktreeStatusContext";

// Actions
import { scan_directory } from "./actions/scan_directory";
import { get_branch_state } from "./actions/get_branch_state";
import { launch_app } from "./actions/launch_app";
import { hide_on_focus_lost } from "./actions/hide_on_focus_lost";
import { get_default_actions } from "./actions/get_default_actions";

// Stylesheets
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.scss";

function App() {
  const [seed, setSeed] = React.useState(0);
  const [version, setVersion] = React.useState<string | null>(null);
  const [showConfig, setShowConfig] = React.useState(false);
  const [config, setConfig] = React.useState<Config>({
    paths: [],
    actions: [],
  });
  const [settings, setSettings] = React.useState<Setting[]>([]);
  const [systemActions, setSystemActions] = React.useState<Action[]>([]);

  const [store, setStore] = React.useState<Store | null>(null);

  React.useEffect(() => {
    getVersion().then((v) => setVersion(v));
    autostart_is_enabled().then((state) => {
      setSettings([
        {
          key: "auto_start",
          displayName: "Auto start",
          type: "bool",
          value: state.toString(),
        },
      ]);
    });
    async function initStore() {
      const newStore = await load("worktree-status", undefined);
      const defaultActions = await get_default_actions();
      setSystemActions(defaultActions);
      newStore.get<Config>("config").then((c) => {
        if (
          c === null ||
          c === undefined ||
          c.paths === undefined ||
          c.actions === undefined
        )
          c = undefined;
        if (c !== undefined && c.paths !== undefined) {
          c.paths = c.paths.map((p) => {
            if (typeof p === "string")
              // Convert string paths to WorktreePath objects
              return { key: crypto.randomUUID(), path: p, displayName: null, filter: null, defaultCollapse: false };
            return p;
          });
        }
        setConfig(
          c || {
            paths: [],
            actions: systemActions,
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
      setConfig({ ...config, paths: [...config.paths, { key: crypto.randomUUID(), path: selected, displayName: null, filter: null, defaultCollapse: false }] });
  }
  function removePath(key: string) {
    setConfig({ ...config, paths: config.paths.filter((v) => v.key !== key) });
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

  function changeSettings(settings: Setting[]) {
    if (settings.find((s) => s.key === "auto_start")?.value === "true") {
      autostart_enable();
    } else {
      autostart_disable();
    }
    setSettings(settings);
  }

  window.onfocus = async () => {
    setSeed((seed + 1) % 1000);
  };
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
          version={version}
          settings={settings}
          onUpdateSettings={(settings: Setting[]) => {
            changeSettings(settings);
          }}
          systemActions={systemActions}
          onAddPath={addPath}
          onRemovePath={(path) => removePath(path)}
          onReorderPaths={(paths) => {
            setConfig({ ...config, paths: paths });
          }}
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
          onReorderActions={(actions) => {
            setConfig({ ...config, actions: actions });
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
      <Updater />
      {config !== null && config.paths.length !== 0 && (
        <WorktreeStatusContext.Provider
          value={{
            seed: seed,
            scan_directory: scan_directory,
            get_branch_state: get_branch_state,
          }}
        >
          <ActionContext.Provider
            value={{
              actions: config.actions,
              onAction: (action, path) => {
                launch_app(action.path, action.arguments, path);
              },
              urlForIcon: urlForIcon,
            }}
          >
            <div className="font-sans">
              <Accordion
                defaultActiveKey={config.paths.map((_path, index) => {
                  if (_path.defaultCollapse) return "";
                  return index.toString();
                }
                )}
                alwaysOpen
              >
                {config !== null &&
                  config.paths.map((path, index) => (
                    <Accordion.Item key={index} eventKey={index.toString()}>
                      <Accordion.Header className="font-serif">
                        {path.displayName || path.path}
                      </Accordion.Header>
                      <Accordion.Body>
                        <DirectoryStatus key={index} worktreePath={path} />
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
