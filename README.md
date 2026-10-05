# Liberty Web Traversal

Local GTA IV traversal prototype based on the swinging, zip, and wall-run ideas in *Marvel's Spider-Man: Miles Morales*.

## What it changes

The player stays in GTA IV: The Complete Edition's Liberty City and Story Mode. This mod adds three traversal actions to the player character:

- Attach a web-like tether to a visible building surface and swing using GTA IV character velocity.
- Zip toward the tether point while it is attached.
- Start a short wall-run assist by jumping while moving forward beside a wall.

The first-minute trial is: get to a rooftop, set a normal GTA IV map waypoint on a street, aim at a taller building, then use the traversal controls to descend toward it.

This is an early mechanics prototype. It does not include a Miles Morales suit, borrowed game assets, custom traversal animations, a rendered web strand, or new GTA IV missions. Miles Morales is a design reference; the current gameplay code runs inside GTA IV and does not read Miles Morales files. The local Miles Morales installation was confirmed, but is not a real runtime dependency for this prototype.

## Controls

| Action | Keyboard |
| --- | --- |
| Attach / release | F7 |
| Web zip while attached | Hold F8 |
| Wall-run assist | Move forward with W, then tap Space beside a wall |
| Swing steering | W / A / D |

F7 and F8 are chosen to avoid GTA IV's usual movement and combat bindings. These are keyboard controls; gamepad support is not in this prototype.

## Build and local install

1. Run `python tools/build.py` from this folder. The build runs sheet preflight before generating the CLEO Redux script.
2. Use the generated `build/package/CLEO/LibertyWebTraversal.js` in the GTA IV install.
3. Install CLEO Redux and Ultimate ASI Loader separately from their official releases; they are not bundled in this project.
4. Copy the generated JavaScript file into GTA IV's `CLEO` folder, then launch GTA IV in offline Story Mode.
5. Confirm `cleo_redux.log` contains `Liberty Web Traversal loaded` before testing F7, F8, and wall-running.

The project is local-only while the runtime test and redistribution license are unresolved. The game files, CLEO Redux, Ultimate ASI Loader, and any Miles Morales files are not included. The runtime and mod files have been installed in the local GTA IV folder. A user-approved launch attempt opened Rockstar Launcher, then GTA IV exited before gameplay; this session exposed no native app windows or UI input control for continuing into Story Mode.

## Credits and license status

- Traversal design reference: *Marvel's Spider-Man: Miles Morales* (Insomniac Games / Sony Interactive Entertainment). No game assets or code are included.
- Host game: *Grand Theft Auto IV: The Complete Edition* (Rockstar Games). No game assets are included.
- CLEO Redux by CLEO Library and Ultimate ASI Loader by ThirteenAG and contributors are local runtime dependencies and are not bundled here.
- Project redistribution license: not selected yet. Do not upload or redistribute this prototype until the author/license choice is confirmed.

## Current verification

The project sheets and generated script are preflighted, and Node.js accepted the generated file's syntax. In-game movement, anchor detection, zip behavior, and the wall-run assist still require validation in Story Mode; the prototype must not be described as gameplay-tested until that is done.
