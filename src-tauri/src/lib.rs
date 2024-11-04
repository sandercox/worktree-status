use git2::Repository;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
};
use tauri_plugin_positioner::{Position, WindowExt};

#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct DirectoryResult {
    name: String,
    path: String,
}

#[derive(serde::Deserialize)]
struct AppPlist {
    #[serde(rename = "CFBundleExecutable")]
    cf_bundle_executable: String,
}

#[tauri::command]
async fn launch_app(app_path: &str, worktree_path: &str) -> Result<(), String> {
    let app_path = app_path.to_string();
    let worktree_path = worktree_path.to_string();

    if app_path.is_empty() || worktree_path.is_empty() {
        return Err("app_path or worktree_path is empty!".to_string());
    }

    // launch external process with arugments
    let _ = std::thread::spawn(move || {
        // On macOS we might be given bundles to launch instead of actual
        // executables. We need to find the executable inside the bundle.
        let mut app_to_launch = app_path.clone();
        #[cfg(target_os = "macos")]
        if app_path.ends_with(".app") {
            // read info plist from Contents to find CFBundleExecutable to run
            let info_plist = app_path.clone() + "/Contents/Info.plist";
            let info_plist: AppPlist = plist::from_file(info_plist).unwrap();

            // lookup CFBundleExecutable
            let app_name = info_plist.cf_bundle_executable.as_str();
            app_to_launch = app_path + "/Contents/MacOS/" + app_name;
        }
        let _ = std::process::Command::new(app_to_launch)
            .arg(worktree_path)
            .spawn()
            .map_err(|e| e.to_string());
    });

    Ok(())
}

#[tauri::command]
async fn scan_directory(path: &str) -> Result<Vec<DirectoryResult>, String> {
    let mut paths = vec![];
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() && path.join(".git").exists() {
                paths.push(DirectoryResult {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: path.to_string_lossy().to_string(),
                });
            }
        }
    }
    Ok(paths)
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct BranchState {
    branch: String,
    ahead: usize,
    behind: usize,

    staged: usize,
    modified: usize,
    deleted: usize,
    untracked: usize,
    conflict: usize,
}

#[tauri::command]
fn get_branch_state(path: &str) -> Result<BranchState, String> {
    // use libgit crate to get the branch state
    let repo = Repository::open(path).map_err(|e| e.message().to_string())?;
    let head = repo.head().map_err(|e| e.message().to_string())?;

    let branch_name = head.shorthand();
    if branch_name.is_none() {
        return Err("Could not get branchname!".to_string());
    }

    let mut branch_name = branch_name.unwrap().to_string();
    if head.is_tag() {
        let tag = head.peel_to_tag();
        if let Ok(tag) = tag {
            branch_name = tag.name().unwrap().to_string();
        }
        branch_name += " is tag!";
    }
    if head.is_branch() {
        branch_name = "BRANCH: ".to_string() + &branch_name;
    }

    if repo.head_detached().unwrap() {
        branch_name += "detached";
    } else {
        branch_name += "attached";
    }

    let reftype = head.kind().unwrap();
    match reftype {
        git2::ReferenceType::Direct => branch_name += "direct",
        git2::ReferenceType::Symbolic => branch_name += "symbolic",
    }

    let branch_name = branch_name;
    let mut ahead = 0;
    let mut behind = 0;

    // get git branch
    if head.is_branch() {
        let branch_name = head.shorthand().unwrap().to_string();
        let branch = repo
            .find_branch(&branch_name, git2::BranchType::Local)
            .map_err(|e| e.message().to_string() + "branch!" + &branch_name)?;
        let upstream = branch.upstream().map_err(|e| e.message().to_string())?;
        (ahead, behind) = repo
            .graph_ahead_behind(
                branch.get().target().unwrap(),
                upstream.get().target().unwrap(),
            )
            .map_err(|e| e.message().to_string() + "ahead-behind!")?;
    }
    let (ahead, behind) = (ahead, behind);

    let statuses = repo
        .statuses(None)
        .map_err(|e| e.message().to_string() + "statuses")?;

    let mut staged = 0;
    let mut modified = 0;
    let mut deleted = 0;
    let mut untracked = 0;
    let mut conflict = 0;

    for entry in statuses.iter() {
        let status = entry.status();
        if status.is_index_new()
            || status.is_index_modified()
            || status.is_index_deleted()
            || status.is_index_renamed()
            || status.is_index_typechange()
        {
            staged += 1;
        }
        if status.is_wt_new() {
            untracked += 1;
        }
        if status.is_wt_modified() {
            modified += 1;
        }
        if status.is_wt_deleted() {
            deleted += 1;
        }
        if status.is_conflicted() {
            conflict += 1;
        }
    }

    Ok(BranchState {
        branch: branch_name,
        ahead,
        behind,
        staged,
        modified,
        deleted,
        untracked,
        conflict,
    })
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn setup_menu(app: &tauri::App, tray: &tauri::tray::TrayIcon) -> tauri::Result<()> {
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit_i])?;

    tray.set_menu(Some(menu))?;
    tray.set_show_menu_on_left_click(false)?;
    tray.on_menu_event(|app, event| match event.id.as_ref() {
        "quit" => {
            app.exit(0);
        }
        _ => {
            eprintln!("menu item {} not handled", event.id.as_ref());
        }
    });
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            app.emit("single-instance", Payload { args: argv, cwd })
                .unwrap();
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            // In debug builds open the webview devtools by default
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            // Hide the application from the macOS dock
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;

            tray.on_tray_icon_event(|tray_handle, event| {
                let app = tray_handle.app_handle();
                tauri_plugin_positioner::on_tray_event(app, &event);
                let win = app.get_webview_window("main").unwrap();
                let _ = win.as_ref().window().move_window(Position::TrayCenter);
                if let tauri::tray::TrayIconEvent::Click { .. } = event {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            });
            setup_menu(app, &tray)?;

            // Hide the window when it loses focus
            let win = app.get_webview_window("main").unwrap();
            win.clone().on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(focussed) = event {
                    if !focussed {
                        println!("Window lost focus");
                        #[cfg(not(debug_assertions))]
                        {
                            let _ = win.hide();
                        }
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            get_branch_state,
            launch_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
