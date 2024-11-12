use crate::macos::plist;

pub fn get_app_binary_path(path: &str) -> Result<String, String> {
    if path.ends_with(".app") {
        // read info plist from Contents to find CFBundleExecutable to run
        let info_plist = plist::application_plist(&path)?;

        // lookup CFBundleExecutable
        let app_name = info_plist.cf_bundle_executable.as_str();
        return Ok(format!("{}/Contents/MacOS/{}", path, app_name));
    }
    Ok(path.to_owned())
}
