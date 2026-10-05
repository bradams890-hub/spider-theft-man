# MODLOG

## Discovery

- Confirmed GTA IV executable: `GTAIV.exe`, version 1.2.0.59, x86.
- Confirmed Miles Morales executable: `MilesMorales.exe`, version 4.0630.0.0, x64.
- No game processes were running when the work resumed.
- The Melty check in the preceding work found neither title installable from Melty and no matching mashup; no draft or release was created.
- No GTA IV save directory was found in the standard user save locations checked before this build.

## Runtime dependencies downloaded to scratch

Downloads were obtained from the official GitHub release pages and unpacked only under the task's `work/staging` folder:

- CLEO Redux 1.5.1 x86: `cleo_redux.asi` plus its bundled `.cleo` plugins. Release archive SHA-256: `8DCC0E83E25AB8C57A52D4CA65470B8EC6FC4E94121E5905B826079D75C2807B`.
- Ultimate ASI Loader 9.7.4 `NoPDB` x86: `dinput8.dll`. Release archive SHA-256: `14B3A1AD018899571AC9AA01482977F3C6D49E6CBA99F552D01C5ACACD1315E1`.
- The loader files are not copied into this source/package folder. The CLEO file is unsigned; Windows Defender scan cmdlets were unavailable in this environment. The ASI loader has an Authenticode certificate identity for FusionFix, but Windows reported `UnknownError` during local signature verification.

## Build and install activity

- Project source and JSON design sheets are under `outputs/LibertyWebTraversal`.
- Preflight passed: 277 populated sheet cells and 90 cross-sheet references resolved. Node.js syntax check passed. Generated script SHA-256: `2B6F5A9BCB2DFE8D06BA9166794956428CCCD4268D7D523050E4E3A9FF89D65A`; the staged GTA IV copy has the same hash.
- Node.js syntax check passed for the generated JavaScript.
- Installed additively into `D:\SteamLibrary\steamapps\common\Grand Theft Auto IV\GTAIV` after confirming the target loader/script files and `CLEO` folder did not exist:
  - `dinput8.dll` (Ultimate ASI Loader), SHA-256 `02380A76A76FFFBF65DEDCE0C9986698FD1F58B58CA2A2AFE79B975B6B886925`.
  - `cleo_redux.asi`, SHA-256 `EC2F4824ECA58DD40F425756A4A7CEC77B8E381F21D11D7C846EC4B339B617AB`.
  - CLEO Redux's `CLEO/CLEO_PLUGINS/*.cleo` support files.
  - Generated `CLEO/LibertyWebTraversal.js`.
- No GTA IV save directory was present in the standard locations checked, so there was no save to snapshot. No game process was running before installation.
- The user approved an offline Story Mode launch and test. Directly starting `GTAIV.exe` opened a Rockstar Launcher process but no GTAIV process remained after the wait; no `cleo_redux.log` or `asi_loader.log` was created. No successful modded game session occurred.
- The only game-tree changes are the files listed above; `GTAIV.exe` and game archives were not changed.

## Test access limitation

- The user approved launching and testing GTA IV with the mod loader.
- Direct launch did not reach a running GTAIV process. The computer-use inventory returned no native apps/windows, its `computer.launch_app` API was unavailable (`computer` was undefined), and `cua.listWindows()` was unavailable. I did not automate any sign-in dialog or use another UI automation method.
- The deliverable is marked not gameplay-tested. The smallest useful next step is to make native desktop app control available for this session and open GTA IV at an active Story Mode free-roam save; there was no save in the standard locations checked.
- Melty still cannot install either selected game, so there is no Melty test or one-click claim.

## Test log

Pending in-game Story Mode validation. Add date, game build, start location, each traversal action tested, result, and any changed sheet values here.
