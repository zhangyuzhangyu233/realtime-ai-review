import os, re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = [
    ("PC (index.html)", os.path.join(REPO_ROOT, "index.html")),
    ("Mobile (mobile.html)", os.path.join(REPO_ROOT, "mobile.html")),
]

for label, path in TARGETS:
    with open(path, encoding="utf-8") as f:
        text = f.read()

    emojis = re.findall(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]", text)
    bare_mono = re.findall(r"(?<!-)\bmonospace\b", text)
    simsun = re.findall(r"SimSun|宋体", text, flags=re.I)
    size_kb = round(len(text.encode("utf-8")) / 1024, 1)

    print(f"[{label}] size={size_kb} KB | emojis={len(emojis)} | bare_monospace={len(bare_mono)} | simsun={len(simsun)}")
    assert len(emojis) == 0, f"{label}: Found emojis: {emojis[:10]}"
    assert len(bare_mono) == 0, f"{label}: Found bare monospace: {bare_mono[:10]}"
    assert len(simsun) == 0, f"{label}: Found SimSun: {simsun[:10]}"

print("[OK] Static audit PASSED for both PC and Mobile bundles!")
