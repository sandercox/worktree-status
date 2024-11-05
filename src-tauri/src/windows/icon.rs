pub fn convert_icon_to_png(icon_path: String) -> Result<Vec<u8>, String> {
    let icon = systemicons::get_icon(&icon_path, 32).map_err(|e| e.message)?;
    Ok(icon)
}
