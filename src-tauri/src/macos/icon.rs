use std::io::{BufReader, BufWriter};

pub fn convert_icns_to_png(icon_path: String) -> Result<Vec<u8>, String> {
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
