use git2::Repository;
use std::{borrow::Cow, io::BufReader, io::BufWriter};
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

    #[serde(rename = "CFBundleIconFile")]
    cf_bundle_icon_file: Option<String>,
}

fn application_plist(app_bundle: &str) -> Result<AppPlist, String> {
    // Check if app_bundle path is a directory
    if !std::path::Path::new(app_bundle).is_dir() {
        return Err("app_bundle is not a directory!".to_string());
    }

    let info_plist = app_bundle.to_string() + "/Contents/Info.plist";
    let plist_content: AppPlist = plist::from_file(info_plist).map_err(|e| e.to_string())?;
    Ok(plist_content)
}

#[tauri::command]
async fn launch_app(app_path: &str, worktree_path: &str) -> Result<(), String> {
    let app_path = app_path.to_string();
    let worktree_path = worktree_path.to_string();

    if app_path.is_empty() || worktree_path.is_empty() {
        return Err("app_path or worktree_path is empty!".to_string());
    }

    // launch external process with arugments
    let mut app_to_launch = app_path.clone();

    // On macOS we might be given bundles to launch instead of actual
    // executables. We need to find the executable inside the bundle.
    #[cfg(target_os = "macos")]
    if app_path.ends_with(".app") {
        // read info plist from Contents to find CFBundleExecutable to run
        let info_plist = application_plist(&app_path)?;

        // lookup CFBundleExecutable
        let app_name = info_plist.cf_bundle_executable.as_str();
        app_to_launch = app_path + "/Contents/MacOS/" + app_name;
    }
    let _ = std::thread::spawn(move || {
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
    let repo = Repository::open(path)
        .map_err(|e| "Could not open repository: ".to_string() + e.message())?;
    let head = repo.head();

    if head.is_err() {
        return Ok(BranchState {
            branch: "".to_string(),
            ahead: 0,
            behind: 0,
            staged: 0,
            modified: 0,
            deleted: 0,
            untracked: 0,
            conflict: 0,
        });
    }
    let head = head.unwrap();
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

    let branch_name = branch_name;
    let mut ahead = 0;
    let mut behind = 0;

    // get git branch
    if head.is_branch() {
        let branch_name = head.shorthand().unwrap().to_string();
        let branch = repo
            .find_branch(&branch_name, git2::BranchType::Local)
            .map_err(|e| e.message().to_string() + "branch!" + &branch_name)?;
        if let Ok(upstream) = branch.upstream() {
            (ahead, behind) = repo
                .graph_ahead_behind(
                    branch.get().target().unwrap(),
                    upstream.get().target().unwrap(),
                )
                .map_err(|e| e.message().to_string() + "ahead-behind!")?;
        }
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

fn convert_icns_to_png(icon_path: String) -> Result<Vec<u8>, String> {
    let icon_path = std::path::Path::new(&icon_path);
    if !icon_path.exists() {
        return Err("Icon path does not exist".to_string());
    }
    let icon = BufReader::new(std::fs::File::open(icon_path).map_err(|e| e.to_string())?);
    let icon_family = icns::IconFamily::read(icon).map_err(|e| e.to_string())?;

    let mut icon = None;
    let icon_types = [
        icns::IconType::RGBA32_32x32_2x,
        icns::IconType::RGBA32_64x64,
        icns::IconType::RGBA32_128x128,
        icns::IconType::RGBA32_128x128_2x,
        icns::IconType::RGBA32_256x256,
        icns::IconType::RGBA32_256x256_2x,
        icns::IconType::RGBA32_512x512,
        icns::IconType::RGBA32_512x512_2x,
        icns::IconType::RGBA32_32x32,
        icns::IconType::RGBA32_16x16_2x,
        icns::IconType::RGBA32_16x16,
    ];

    for icon_type in icon_types.iter() {
        if let Ok(found_icon) = icon_family.get_icon_with_type(*icon_type) {
            dbg!(icon_type);
            icon = Some(found_icon);
            break;
        }
    }

    let mut icon_png_data = Vec::new();
    let png_icon = BufWriter::new(&mut icon_png_data);
    if icon.is_none() {
        return Err("No proper icon size found in icns file".to_string());
    }
    let icon = icon.unwrap();
    icon.write_png(png_icon).map_err(|e| e.to_string())?;
    Ok(icon_png_data)
}

fn serve_image(req: tauri::http::Request<Vec<u8>>) -> Result<(&'static str, Vec<u8>), String> {
    dbg!(&req);

    // get icon from request
    let request_path = req.uri().path();
    let request_path = &request_path[1..];

    // url decode the path
    let request_path = urlencoding::decode(request_path).unwrap();
    dbg!(&request_path);
    if !std::path::Path::new(request_path.as_ref()).exists() {
        return Err(format!("Path does not exist '{}'", request_path));
    }

    let mut icon_path = request_path.to_string();

    #[cfg(target_os = "macos")]
    if request_path.ends_with(".app") {
        // open info plist and get CFBundleIconFile
        let info_plist = application_plist(&request_path)?;
        if info_plist.cf_bundle_icon_file.is_none() {
            return Err("No CFBundleIconFile found in Info.plist".to_string());
        } else {
            dbg!(&info_plist.cf_bundle_icon_file);
            let icon_file = info_plist.cf_bundle_icon_file.unwrap();

            icon_path = request_path.to_string()
                + "/Contents/Resources/"
                + &icon_file
                + icon_file.contains('.').then(|| "").unwrap_or(".icns");
        }
    }

    #[cfg(target_os = "macos")]
    if icon_path.ends_with(".icns") {
        let image_data = convert_icns_to_png(icon_path)?;
        return Ok(("image/png", image_data));
    }

    #[cfg(target_os = "windows")]
    if icon_path.ends_with(".ico") {
        let image_data = convert_ico_to_png(icon_path)?;
        return Ok(("image/png", image_data));
    } else if icon_path.ends_with(".exe") {
        let image_data = convert_exe_to_png(icon_path)?;
        return Ok(("image/png", image_data));
    }

    let mime_type;
    if icon_path.ends_with(".png") {
        mime_type = "image/png";
    } else if icon_path.ends_with(".jpg") || icon_path.ends_with(".jpeg") {
        mime_type = "image/jpeg";
    } else if icon_path.ends_with(".gif") {
        mime_type = "image/gif";
    } else if icon_path.ends_with(".svg") {
        mime_type = "image/svg+xml";
    } else {
        return Err("Unknown image extension".to_string() + &icon_path);
    }

    let image_data = std::fs::read(icon_path).map_err(|e| e.to_string())?;

    Ok((mime_type, image_data))
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
            #[cfg(not(debug_assertions))]
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
                        dbg!("Window lost focus - but not hiding because debug mode!");
                        #[cfg(not(debug_assertions))]
                        {
                            let _ = win.hide();
                        }
                    }
                }
            });
            Ok(())
        })
        .register_uri_scheme_protocol("worktree-status", |_app_handle, req| {
            let builder =
                tauri::http::Response::builder().header("Access-Control-Allow-Origin", "*");
            let response = serve_image(req);
            match response {
                Ok((mime_type, image_data)) => builder
                    .status(tauri::http::StatusCode::OK)
                    .header("Content-Type", mime_type)
                    .body(Cow::Owned(image_data))
                    .unwrap(),
                Err(e) => {
                    eprintln!("Error: {}", e);
                    let msg = "Internal Server Error\n\n".to_string() + &e;
                    builder
                        .status(tauri::http::StatusCode::INTERNAL_SERVER_ERROR)
                        .body(Cow::Owned(msg.into_bytes()))
                        .unwrap()
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            get_branch_state,
            launch_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
