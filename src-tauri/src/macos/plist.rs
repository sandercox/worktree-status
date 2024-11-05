#[derive(serde::Deserialize)]
pub struct AppPlist {
    #[serde(rename = "CFBundleExecutable")]
    pub cf_bundle_executable: String,

    #[serde(rename = "CFBundleIconFile")]
    pub cf_bundle_icon_file: Option<String>,
}

pub fn application_plist(app_bundle: &str) -> Result<AppPlist, String> {
    // Check if app_bundle path is a directory
    if !std::path::Path::new(app_bundle).is_dir() {
        return Err("app_bundle is not a directory!".to_string());
    }

    let info_plist = app_bundle.to_string() + "/Contents/Info.plist";
    let plist_content: AppPlist = plist::from_file(info_plist).map_err(|e| e.to_string())?;
    Ok(plist_content)
}
