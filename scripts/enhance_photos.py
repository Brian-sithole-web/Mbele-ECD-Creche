"""Prepare authentic Mbele ECD photographs for the website.

Enhancement stays photographic: gentle contrast, colour and sharpness,
modest upscaling, and editorial crops. Faces, skin tones and the real
environment are preserved.
"""

from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SOURCE_DIR = Path(__file__).resolve().parent.parent / "source-photos"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "images"

# Long-edge targets for responsive delivery.
LARGE_EDGE = 1920
MEDIUM_EDGE = 960
JPEG_EDGE = 1400


def content_box(image: Image.Image, threshold: int = 246) -> tuple[int, int, int, int]:
    """Bounding box of pixels that are not near-white. Used for the logo only."""
    rgb = image.convert("RGB")
    pixels = rgb.load()
    width, height = rgb.size
    min_x, min_y, max_x, max_y = width, height, 0, 0
    for y in range(height):
        for x in range(width):
            red, green, blue = pixels[x, y]
            if red < threshold or green < threshold or blue < threshold:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x <= min_x or max_y <= min_y:
        return (0, 0, width, height)
    return (min_x, min_y, max_x + 1, max_y + 1)


def enhance_photograph(image: Image.Image, compressed: bool) -> Image.Image:
    """Correct exposure and colour lightly, then reduce compression speckle."""
    photograph = ImageOps.autocontrast(image.convert("RGB"), cutoff=0.35)
    if compressed:
        photograph = photograph.filter(ImageFilter.MedianFilter(size=3))
    photograph = ImageEnhance.Color(photograph).enhance(1.05)
    photograph = ImageEnhance.Contrast(photograph).enhance(1.05)
    photograph = ImageEnhance.Brightness(photograph).enhance(1.03)
    return photograph


def resize_long_edge(image: Image.Image, long_edge: int) -> Image.Image:
    width, height = image.size
    current_long_edge = max(width, height)
    if current_long_edge == long_edge:
        return image
    scale = long_edge / current_long_edge
    resized = image.resize(
        (max(1, round(width * scale)), max(1, round(height * scale))),
        Image.Resampling.LANCZOS,
    )
    # A light unsharp pass restores clarity after resizing without plastic skin.
    amount = 60 if scale > 1.4 else 45
    return resized.filter(ImageFilter.UnsharpMask(radius=1.15, percent=amount, threshold=4))


def save_set(image: Image.Image, stem: str) -> None:
    large = resize_long_edge(image, LARGE_EDGE)
    medium = resize_long_edge(image, MEDIUM_EDGE)
    jpeg_image = resize_long_edge(image, JPEG_EDGE)
    large.save(OUTPUT_DIR / f"{stem}-1920.webp", "WEBP", quality=82, method=6)
    medium.save(OUTPUT_DIR / f"{stem}-960.webp", "WEBP", quality=78, method=6)
    jpeg_image.save(
        OUTPUT_DIR / f"{stem}.jpg",
        "JPEG",
        quality=84,
        optimize=True,
        progressive=True,
    )
    print(f"{stem}: source {image.size[0]}x{image.size[1]} -> {large.size[0]}x{large.size[1]}")


def prepare_logo() -> None:
    logo = Image.open(SOURCE_DIR / "logo.png").convert("RGBA")
    # The source screenshot includes a stray mark beneath the crest.
    width, height = logo.size
    logo = logo.crop((0, 0, width, int(height * 0.9)))
    left, top, right, bottom = content_box(logo)
    pad = 8
    logo = logo.crop(
        (
            max(0, left - pad),
            max(0, top - pad),
            min(logo.width, right + pad),
            min(logo.height, bottom + pad),
        )
    )
    logo = logo.resize((logo.width * 3, logo.height * 3), Image.Resampling.LANCZOS)
    logo.save(OUTPUT_DIR / "logo.png", "PNG", optimize=True)

    crest = logo.copy()
    side = max(crest.size)
    icon = Image.new("RGBA", (side, side), (255, 255, 255, 0))
    icon.paste(crest, ((side - crest.width) // 2, (side - crest.height) // 2), crest)
    favicon_bg = Image.new("RGB", (192, 192), (244, 239, 230))
    fitted = icon.resize((168, 168), Image.Resampling.LANCZOS)
    favicon_bg.paste(fitted, (12, 12), fitted)
    favicon_bg.save(OUTPUT_DIR / "favicon.png", "PNG", optimize=True)
    favicon_bg.resize((180, 180), Image.Resampling.LANCZOS).save(OUTPUT_DIR / "apple-touch-icon.png", "PNG")
    print(f"logo: {logo.size[0]}x{logo.size[1]}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    prepare_logo()

    photographs = {
        "class-group": False,
        "medal-ceremony": False,
        "play-courtyard": False,
        "graduation-stage": False,
        "graduation-gowns": True,
        "tracksuits": False,
        "career-care": False,
        "career-roles": False,
        "exterior-mural": False,
        "certificates": True,
    }

    for stem, compressed in photographs.items():
        source_name = "certificates-bags.jpg" if stem == "certificates" else f"{stem}.jpg"
        photograph = enhance_photograph(Image.open(SOURCE_DIR / source_name), compressed)
        if stem == "certificates":
            # Keep the branded bags and frames. Crop away the handwritten
            # child's name on the front gift bag.
            width, height = photograph.size
            photograph = photograph.crop((0, int(height * 0.18), width, int(height * 0.545)))
        save_set(photograph, stem)


if __name__ == "__main__":
    main()
