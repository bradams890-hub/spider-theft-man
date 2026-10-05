# Modding plan

## Target and scope

- Host game: GTA IV: The Complete Edition, Steam build 1.2.0.59 (x86), installed at `D:\SteamLibrary\steamapps\common\Grand Theft Auto IV\GTAIV`.
- Design target: Miles Morales-style traversal timing and move set. No game files or extracted assets are used.
- Play mode: solo Story Mode only.
- First slice: free-roam traversal controls for a rooftop-to-street waypoint run: tether swing, zip, wall-run assist.

## Route

Use CLEO Redux JavaScript on top of Ultimate ASI Loader. CLEO Redux documents support for GTA IV Complete Edition 1.2.0.59 and native calls; the mod only uses game-native player, camera, input, and velocity functions. Neither game's executable or data archives are patched.

## Design constraints

- A tether target is approximated from the first environment-occluded point along the camera aim ray. GTA IV's `CAM_IS_SPHERE_VISIBLE` does not provide a collision hit position, so this is a surface-proximity estimate and needs in-game review.
- Tether motion uses a spring-and-radial-velocity correction. It is a controllable traversal prototype, not a replacement for Miles Morales' animation and rope solver.
- The wall-run is a short velocity assist gated by a side visibility probe. It may need tuning against GTA IV's collision and camera behavior.
- No multiplayer, outfit conversion, game assets, mission rewrite, or online mode is included.

## Preflight/build/test sequence

1. Check that every sheet cell is populated and every feature reference resolves.
2. Generate the CLEO Redux JavaScript from the sheets.
3. Install the runtime dependencies locally, preserving any existing loader files. (Done; exact files and hashes are in `MODLOG.md`.)
4. Launch GTA IV in Story Mode and verify the CLEO log before touching gameplay. (The user approved the launch attempt; it stopped at the Rockstar Launcher and no native app controls were exposed.)
5. Test attach/release, swing, zip, wall-run, death/vehicle handling, and a rooftop-to-waypoint route; record findings in `MODLOG.md` and tune the sheets before another build.
6. Capture real gameplay only after the distinctive traversal behavior works.

## Publishing status

Melty currently cannot install either selected game or run a recipe for them, so this route cannot produce a one-click Melty release. This project remains a local GTA IV mod prototype; it does not claim Melty compatibility. The locally installed Miles Morales copy is a design target but is not needed by this script.
