from __future__ import annotations

import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable


def main() -> int:
    preflight = subprocess.run([PYTHON, str(ROOT / "tools" / "preflight.py")], cwd=ROOT)
    if preflight.returncode:
        return preflight.returncode

    controls_sheet = json.loads((ROOT / "sheets" / "controls.json").read_text(encoding="utf-8"))
    parameters_sheet = json.loads((ROOT / "sheets" / "parameters.json").read_text(encoding="utf-8"))
    config = {
        "controls": {row["id"]: {"virtual_key": row["virtual_key"], "native": row["native"]} for row in controls_sheet["controls"]},
        "parameters": parameters_sheet["parameters"],
    }
    template = (ROOT / "src" / "LibertyWebTraversal.template.js").read_text(encoding="utf-8")
    generated = template.replace("@@CONFIG_JSON@@", json.dumps(config, ensure_ascii=False, separators=(",", ":")))

    output = ROOT / "build" / "package" / "CLEO" / "LibertyWebTraversal.js"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(generated, encoding="utf-8", newline="\n")
    install_note = (
        "Liberty Web Traversal — local prototype\n"
        "Copy this CLEO folder into a GTA IV Complete Edition 1.2.0.59 install with CLEO Redux and an ASI loader already installed.\n"
        "This package contains no game files or runtime loader. Launch in offline Story Mode.\n"
        "Keys: F7 attach/release, hold F8 to zip, W/A/D steer, W + Space beside a wall for wall-run assist.\n"
    )
    (ROOT / "build" / "package" / "INSTALL.txt").write_text(install_note, encoding="utf-8", newline="\n")
    status_note = (
        "Build status: generated and syntax-checked.\n"
        "Launch attempt: user-approved start opened Rockstar Launcher, but GTAIV exited before gameplay; no CLEO or ASI log appeared.\n"
        "Gameplay status: not tested in-game. Native UI control was unavailable, and no free-roam Story Mode save was found in the standard locations checked.\n"
        "Do not describe this build as gameplay-tested until attach, swing, zip, wall-run, and waypoint traversal have been observed in Story Mode.\n"
    )
    (ROOT / "build" / "package" / "TEST_STATUS.txt").write_text(status_note, encoding="utf-8", newline="\n")
    archive = ROOT / "build" / "liberty-web-traversal-prototype.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as output_zip:
        for item in sorted((ROOT / "build" / "package").rglob("*")):
            if item.is_file():
                output_zip.write(item, item.relative_to(ROOT / "build" / "package"))
    print(f"BUILD COMPLETE: {output.relative_to(ROOT)}")
    print(f"PACKAGE: {archive.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
