#!/usr/bin/env python3
"""Configure Godot's Android paths/version without writing signing secrets."""
import argparse
import json
import os
from pathlib import Path
import re

parser = argparse.ArgumentParser()
parser.add_argument("--version-code", type=int, required=True)
parser.add_argument("--sdk", type=Path, required=True)
parser.add_argument("--java", type=Path, required=True)
args = parser.parse_args()
if not 1 <= args.version_code <= 2_100_000_000:
    parser.error("version-code must be 1..2100000000")
for directory in (args.sdk, args.java):
    if not directory.is_dir():
        parser.error(f"Directory does not exist: {directory}")
preset = Path(__file__).resolve().parents[1] / "godot/export_presets.cfg"
source = preset.read_text()
source, count = re.subn(r"(?m)^version/code=\d+$", f"version/code={args.version_code}", source)
if count != 1:
    raise RuntimeError("Expected exactly one Android version/code")
source, count = re.subn(r'(?m)^version/name="[^"]*"$', f'version/name="0.1.0.{args.version_code}"', source)
if count != 1:
    raise RuntimeError("Expected exactly one Android version/name")
preset.write_text(source)
config = Path(os.environ.get("XDG_CONFIG_HOME", str(Path.home() / ".config"))) / "godot"
config.mkdir(parents=True, exist_ok=True)
settings = config / "editor_settings-4.6.tres"
source = settings.read_text() if settings.exists() else '[gd_resource type="EditorSettings" format=3]\n\n[resource]\n'
for key, value in {"export/android/android_sdk_path": args.sdk.resolve(), "export/android/java_sdk_path": args.java.resolve()}.items():
    line = f"{key} = {json.dumps(str(value))}"
    if re.search(rf"(?m)^{re.escape(key)}\s*=.*$", source):
        source = re.sub(rf"(?m)^{re.escape(key)}\s*=.*$", lambda _: line, source)
    else:
        source += line + "\n"
settings.write_text(source)
print(f"Godot Android versionCode={args.version_code}; SDK paths configured")
