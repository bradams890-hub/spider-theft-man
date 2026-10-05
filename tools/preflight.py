from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"


def read_sheet(name: str) -> dict:
    return json.loads((SHEETS / name).read_text(encoding="utf-8"))


def check_filled(value, path: str, errors: list[str]) -> None:
    if value is None or value == "":
        errors.append(f"unfilled cell: {path}")
    elif isinstance(value, dict):
        for key, child in value.items():
            check_filled(child, f"{path}.{key}", errors)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            check_filled(child, f"{path}[{index}]", errors)


def main() -> int:
    controls_sheet = read_sheet("controls.json")
    parameters_sheet = read_sheet("parameters.json")
    natives_sheet = read_sheet("natives.json")
    runtime_sheet = read_sheet("runtime_apis.json")
    systems_sheet = read_sheet("systems.json")
    errors: list[str] = []

    for name, sheet in (
        ("controls", controls_sheet),
        ("parameters", parameters_sheet),
        ("natives", natives_sheet),
        ("runtime_apis", runtime_sheet),
        ("systems", systems_sheet),
    ):
        check_filled(sheet, name, errors)

    controls = {row["id"]: row for row in controls_sheet["controls"]}
    natives = {row["id"]: row for row in natives_sheet["natives"]}
    runtime_apis = {row["id"]: row for row in runtime_sheet["runtime_apis"]}
    parameters = parameters_sheet["parameters"]
    systems = systems_sheet["systems"]

    if len(controls) != len(controls_sheet["controls"]):
        errors.append("duplicate control id")
    if len(natives) != len(natives_sheet["natives"]):
        errors.append("duplicate native id")
    if len({row["id"] for row in systems}) != len(systems):
        errors.append("duplicate system id")

    for row in controls_sheet["controls"]:
        if row["native"] not in {native["name"] for native in natives.values()}:
            errors.append(f"control {row['id']} references missing native {row['native']}")
    for row in systems:
        for ref in row["control_refs"]:
            if ref not in controls:
                errors.append(f"system {row['id']} references missing control {ref}")
        for ref in row["native_refs"]:
            if ref not in natives:
                errors.append(f"system {row['id']} references missing native {ref}")
        for ref in row["runtime_refs"]:
            if ref not in runtime_apis:
                errors.append(f"system {row['id']} references missing runtime API {ref}")
        for ref in row["parameter_refs"]:
            if ref not in parameters:
                errors.append(f"system {row['id']} references missing parameter {ref}")

    template = (ROOT / "src" / "LibertyWebTraversal.template.js").read_text(encoding="utf-8")
    if template.count("@@CONFIG_JSON@@") != 1:
        errors.append("template must contain exactly one @@CONFIG_JSON@@ placeholder")
    known_controls = set(controls)
    for match in re.finditer(r'keyPressed\("([a-z_]+)"\)', template):
        if match.group(1) not in known_controls:
            errors.append(f"source references missing control {match.group(1)}")
    if "@@CONFIG_JSON@@" in template.replace("@@CONFIG_JSON@@", "", 1):
        errors.append("unresolved or duplicate config placeholder")

    if errors:
        print("PREFLIGHT FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    cells = sum(1 for _ in walk_cells(controls_sheet, parameters_sheet, natives_sheet, runtime_sheet, systems_sheet))
    references = sum(len(row["control_refs"]) + len(row["native_refs"]) + len(row["runtime_refs"]) + len(row["parameter_refs"]) for row in systems)
    print(f"PREFLIGHT CLEAN: {cells} populated sheet cells; {references} cross-sheet references resolved; config template ready.")
    return 0


def walk_cells(*values):
    for value in values:
        if isinstance(value, dict):
            for child in value.values():
                yield from walk_cells(child)
        elif isinstance(value, list):
            for child in value:
                yield from walk_cells(child)
        else:
            yield value


if __name__ == "__main__":
    sys.exit(main())
