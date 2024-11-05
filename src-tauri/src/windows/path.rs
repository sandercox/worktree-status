pub fn resolve_using_path(file_path: String) -> Option<String> {
    // find excutable in path
    let path = std::env::var("PATH").unwrap();
    let paths = path.split(';');
    for p in paths {
        let exe_path = std::path::Path::new(p).join(&file_path);
        if exe_path.exists() {
            return Some(exe_path.to_string_lossy().to_string());
        }
    }
    None
}
