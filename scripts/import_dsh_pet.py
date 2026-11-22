import base64
import io
import json
import os
import subprocess
import tempfile
import urllib.parse
import urllib.request

from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PET_DIR = os.path.join(REPO_ROOT, "assets", "pet")
RAW_BASE = "https://raw.githubusercontent.com/PC2005-cloud/dsh-pet/main"

CLIPS = [
    ("idle", "待机呼吸休闲.webm"),
    ("wave", "点击回应-元气挥手.webm"),
    ("think", "工作状态-思考冒泡.webm"),
    ("deep_think", "深度思考碎碎念.webm"),
    ("code", "写代码.webm"),
    ("notes", "轻快记录.webm"),
    ("happy", "点击回应-开心跃动.webm"),
    ("celebrate", "工作状态-雀跃庆祝.webm"),
    ("oops", "工作状态-垂头叹气冒汗.webm"),
    ("sleep", "睡觉-循环.webm"),
    ("search", "工作状态-原地踱步张望.webm"),
]


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def main():
    os.makedirs(PET_DIR, exist_ok=True)

    # 1. Save upstream MIT LICENSE
    lic_data = fetch_bytes(f"{RAW_BASE}/LICENSE")
    lic_path = os.path.join(PET_DIR, "LICENSE_DSH_PET.txt")
    with open(lic_path, "wb") as f:
        f.write(lic_data)
    print(f"[OK] Saved MIT LICENSE -> {lic_path}")

    total_webp_bytes = 0
    with tempfile.TemporaryDirectory() as tmpdir:
        for idx, (key, src_name) in enumerate(CLIPS, 1):
            encoded = urllib.parse.quote(src_name)
            url = f"{RAW_BASE}/dsh-pet/assets/webm/{encoded}"
            raw_path = os.path.join(tmpdir, f"{key}.webm")
            out_webp = os.path.join(PET_DIR, f"{key}.webp")

            print(f"[{idx}/{len(CLIPS)}] Downloading {src_name} -> {key}.webp ...")
            raw_bytes = fetch_bytes(url)
            with open(raw_path, "wb") as f:
                f.write(raw_bytes)

            # IMPORTANT: -c:v libvpx-vp9 MUST come before -i to preserve VP9 alpha channel!
            # Clean VP9 alpha quantization edge noise (<16 -> 0) and tightly frame character at 180x180
            vf_anim = (
                "fps=10,"
                "crop='min(320,min(iw,ih))':'min(320,min(iw,ih))':(iw-ow)/2:(ih-oh)/2,"
                "scale=180:180:flags=lanczos,"
                "lut=a='if(lt(val,16),0,val)'"
            )
            cmd = [
                "ffmpeg",
                "-y",
                "-loglevel",
                "error",
                "-c:v",
                "libvpx-vp9",
                "-i",
                raw_path,
                "-vf",
                vf_anim,
                "-c:v",
                "libwebp_anim",
                "-lossless",
                "0",
                "-compression_level",
                "6",
                "-quality",
                "56",
                "-loop",
                "0",
                "-preset",
                "drawing",
                "-an",
                out_webp,
            ]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode != 0:
                raise RuntimeError(f"ffmpeg failed for {key}: {r.stderr}")

            # Verify transparent animated WebP via Pillow
            im = Image.open(out_webp)
            n_frames = getattr(im, "n_frames", 1)
            rgba = im.convert("RGBA")
            w, h = rgba.size
            corner_alpha = max(
                rgba.getpixel((0, 0))[3],
                rgba.getpixel((w - 1, 0))[3],
                rgba.getpixel((0, h - 1))[3],
                rgba.getpixel((w - 1, h - 1))[3],
            )
            bbox = rgba.getbbox()
            size_b = os.path.getsize(out_webp)
            total_webp_bytes += size_b
            print(
                f"  -> {key}.webp: {size_b / 1024:.1f} KB, size={w}x{h}, frames={n_frames}, corner_alpha={corner_alpha}, bbox={bbox}"
            )
            assert n_frames > 1, f"{key}.webp must be animated (got {n_frames} frames)"
            assert (w, h) == (180, 180), f"{key}.webp size mismatch: {(w, h)}"
            assert corner_alpha == 0, f"{key}.webp is NOT transparent (corner_alpha={corner_alpha})"
            assert bbox is not None, f"{key}.webp has empty alpha!"

            # Generate lightweight offline transparent PNG fallback from frame 0 of idle
            if key == "idle":
                png_raw = os.path.join(tmpdir, "fallback_raw.png")
                vf_png = (
                    "crop='min(320,min(iw,ih))':'min(320,min(iw,ih))':(iw-ow)/2:(ih-oh)/2,"
                    "scale=180:180:flags=lanczos,"
                    "lut=a='if(lt(val,16),0,val)'"
                )
                cmd_png = [
                    "ffmpeg",
                    "-y",
                    "-loglevel",
                    "error",
                    "-c:v",
                    "libvpx-vp9",
                    "-i",
                    raw_path,
                    "-vframes",
                    "1",
                    "-vf",
                    vf_png,
                    png_raw,
                ]
                r2 = subprocess.run(cmd_png, capture_output=True, text=True)
                if r2.returncode != 0:
                    raise RuntimeError(f"ffmpeg fallback PNG failed: {r2.stderr}")
                fb_im = Image.open(png_raw).convert("RGBA")
                # Quantize to 256-color RGBA palette to keep embedded offline fallback crisp & <= 45 KB
                fb_q = fb_im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
                buf = io.BytesIO()
                fb_q.save(buf, format="PNG", optimize=True)
                png_bytes = buf.getvalue()
                fb_png_path = os.path.join(PET_DIR, "fallback.png")
                with open(fb_png_path, "wb") as f:
                    f.write(png_bytes)

                # Verify fallback transparency
                fb_chk = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
                fb_ca = max(fb_chk.getpixel((0, 0))[3], fb_chk.getpixel((179, 179))[3])
                assert fb_ca == 0, f"fallback.png not transparent (corner alpha={fb_ca})"

                b64_uri = "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")
                fb_json_path = os.path.join(PET_DIR, "fallback_b64.json")
                with open(fb_json_path, "w", encoding="utf-8") as f:
                    json.dump(b64_uri, f)
                print(
                    f"[OK] Saved offline transparent fallback.png ({len(png_bytes) / 1024:.1f} KB) & fallback_b64.json"
                )

    print(f"\n[DONE] All 11 animated WebP clips imported cleanly! Total size: {total_webp_bytes / 1024:.1f} KB ({total_webp_bytes / (1024 * 1024):.2f} MB)")


if __name__ == "__main__":
    main()
