"use strict";

const CFG = {"controls":{"attach_release":{"virtual_key":118,"native":"IS_GAME_KEYBOARD_KEY_JUST_PRESSED"},"zip":{"virtual_key":119,"native":"IS_GAME_KEYBOARD_KEY_PRESSED"},"forward":{"virtual_key":87,"native":"IS_GAME_KEYBOARD_KEY_PRESSED"},"left":{"virtual_key":65,"native":"IS_GAME_KEYBOARD_KEY_PRESSED"},"right":{"virtual_key":68,"native":"IS_GAME_KEYBOARD_KEY_PRESSED"},"wallrun_jump":{"virtual_key":32,"native":"IS_GAME_KEYBOARD_KEY_JUST_PRESSED"}},"parameters":{"tick_ms":16,"max_frame_seconds":0.05,"camera_pitch_sign":1,"hook_scan_start_m":6.0,"hook_max_range_m":55.0,"hook_scan_step_m":1.5,"hook_min_height_delta_m":0.75,"anchor_clearance_m":0.25,"anchor_visibility_radius_m":0.15,"anchor_bisection_iterations":6,"rope_min_length_m":4.0,"rope_max_length_m":42.0,"tether_stiffness":10.0,"tether_max_acceleration":16.0,"radial_damping":0.92,"swing_pump_acceleration":2.2,"zip_acceleration":18.0,"zip_retract_mps":8.0,"zip_speed_limit_mps":34.0,"release_impulse_mps":3.0,"wall_run_duration_ms":950,"wall_run_speed_mps":8.0,"wall_run_upward_velocity_mps":0.5,"wall_run_side_probe_m":0.9,"wall_run_height_m":1.15,"wall_run_probe_radius_m":0.18,"wall_run_jump_impulse_mps":5.5,"wall_run_up_impulse_mps":4.5,"minimum_forward_speed_mps":1.5,"tutorial_message":"F7 web/release | Hold F8 zip | W+A/D steer | W + Space beside a wall: wall-run"}};
const DEG_TO_RAD = Math.PI / 180;
let tether = null;
let wallRun = null;
let lastTickMs = Date.now();
let shownIntro = false;

function vec(x, y, z) { return { x: x, y: y, z: z }; }
function add(a, b) { return vec(a.x + b.x, a.y + b.y, a.z + b.z); }
function sub(a, b) { return vec(a.x - b.x, a.y - b.y, a.z - b.z); }
function scale(a, amount) { return vec(a.x * amount, a.y * amount, a.z * amount); }
function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function length(a) { return Math.sqrt(dot(a, a)); }
function normalize(a) {
  const magnitude = length(a);
  return magnitude > 0.0001 ? scale(a, 1 / magnitude) : vec(0, 0, 0);
}
function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
function dist(a, b) { return length(sub(a, b)); }

function keyPressed(controlId) {
  const control = CFG.controls[controlId];
  return !!native(control.native, control.virtual_key);
}

function cameraFrame() {
  const camera = native("GET_GAME_CAM");
  if (camera === undefined || camera === null) return null;
  const position = native("GET_CAM_POS", camera);
  const rotation = native("GET_CAM_ROT", camera);
  if (!position || !rotation) return null;
  const pitch = rotation.angleX * DEG_TO_RAD * CFG.parameters.camera_pitch_sign;
  const yaw = rotation.angleZ * DEG_TO_RAD;
  const cosPitch = Math.cos(pitch);
  const direction = normalize(vec(-Math.sin(yaw) * cosPitch, Math.cos(yaw) * cosPitch, Math.sin(pitch)));
  return { handle: camera, position: vec(position.x, position.y, position.z), direction: direction };
}

function charPosition(ped) {
  const result = native("GET_CHAR_COORDINATES", ped);
  return result ? vec(result.x, result.y, result.z) : null;
}

function charVelocity(ped) {
  const result = native("GET_CHAR_VELOCITY", ped);
  return result ? vec(result.x, result.y, result.z) : vec(0, 0, 0);
}

function isSphereVisible(camera, point) {
  const p = CFG.parameters;
  return !!native("CAM_IS_SPHERE_VISIBLE", camera.handle, point.x, point.y, point.z, p.anchor_visibility_radius_m);
}

function findAnchor(ped, camera) {
  const p = CFG.parameters;
  const player = charPosition(ped);
  if (!player || camera.direction.z < -0.25) return null;

  let clearDistance = p.hook_scan_start_m;
  const firstPoint = add(camera.position, scale(camera.direction, clearDistance));
  if (firstPoint.z < player.z + p.hook_min_height_delta_m || !isSphereVisible(camera, firstPoint)) return null;

  let blockedDistance = null;
  for (let d = clearDistance + p.hook_scan_step_m; d <= p.hook_max_range_m; d += p.hook_scan_step_m) {
    const sample = add(camera.position, scale(camera.direction, d));
    if (sample.z < player.z + p.hook_min_height_delta_m) continue;
    if (!isSphereVisible(camera, sample)) {
      blockedDistance = d;
      break;
    }
    clearDistance = d;
  }
  if (blockedDistance === null) return null;

  for (let i = 0; i < p.anchor_bisection_iterations; i += 1) {
    const middle = (clearDistance + blockedDistance) * 0.5;
    const sample = add(camera.position, scale(camera.direction, middle));
    if (isSphereVisible(camera, sample)) clearDistance = middle;
    else blockedDistance = middle;
  }

  const anchorDistance = Math.max(p.hook_scan_start_m, clearDistance - p.anchor_clearance_m);
  const anchor = add(camera.position, scale(camera.direction, anchorDistance));
  if (anchor.z < player.z + p.hook_min_height_delta_m) return null;
  const ropeLength = dist(player, anchor);
  if (ropeLength < p.rope_min_length_m || ropeLength > p.rope_max_length_m) return null;
  return { point: anchor, ropeLength: ropeLength };
}

function charForward(ped) {
  const heading = native("GET_CHAR_HEADING", ped) * DEG_TO_RAD;
  return normalize(vec(-Math.sin(heading), Math.cos(heading), 0));
}

function charRight(ped) {
  const forward = charForward(ped);
  return vec(forward.y, -forward.x, 0);
}

function beginTether(ped, camera) {
  const found = findAnchor(ped, camera);
  if (!found) {
    showTextBox("No high building surface in sight. Aim above the street and tap F7.");
    return;
  }
  tether = { anchor: found.point, ropeLength: found.ropeLength };
  wallRun = null;
  log("Liberty Web Traversal: tether attached; rope length", found.ropeLength);
  showTextBox("Tether connected — hold F8 to zip, tap F7 to release.");
}

function releaseTether(ped) {
  if (!tether) return;
  const velocity = charVelocity(ped);
  const forward = charForward(ped);
  const boost = CFG.parameters.release_impulse_mps;
  native("SET_CHAR_VELOCITY", ped, velocity.x + forward.x * boost, velocity.y + forward.y * boost, velocity.z + 0.5);
  tether = null;
  log("Liberty Web Traversal: tether released");
  showTextBox("Released — keep your momentum.");
}

function toggleTether(ped, camera) {
  if (tether) releaseTether(ped);
  else beginTether(ped, camera);
}

function updateTether(ped, dt) {
  if (!tether) return;
  const p = CFG.parameters;
  const position = charPosition(ped);
  if (!position) return;
  const velocity = charVelocity(ped);
  const fromAnchor = sub(position, tether.anchor);
  const distance = length(fromAnchor);
  if (distance < 0.001) {
    tether = null;
    return;
  }

  const radial = scale(fromAnchor, 1 / distance);
  const stretch = Math.max(0, distance - tether.ropeLength);
  const tetherAcceleration = Math.min(p.tether_max_acceleration, stretch * p.tether_stiffness);
  let nextVelocity = sub(velocity, scale(radial, tetherAcceleration * dt));
  const outwardVelocity = dot(nextVelocity, radial);
  if (stretch > 0 && outwardVelocity > 0) {
    nextVelocity = sub(nextVelocity, scale(radial, outwardVelocity * p.radial_damping));
  }

  const forward = charForward(ped);
  const right = charRight(ped);
  let steering = vec(0, 0, 0);
  if (keyPressed("forward")) steering = add(steering, forward);
  if (keyPressed("left")) steering = sub(steering, right);
  if (keyPressed("right")) steering = add(steering, right);
  const tangentSteering = sub(steering, scale(radial, dot(steering, radial)));
  nextVelocity = add(nextVelocity, scale(tangentSteering, p.swing_pump_acceleration * dt));

  if (keyPressed("zip")) {
    const towardAnchor = scale(radial, -1);
    nextVelocity = add(nextVelocity, scale(towardAnchor, p.zip_acceleration * dt));
    tether.ropeLength = Math.max(p.rope_min_length_m, tether.ropeLength - p.zip_retract_mps * dt);
  }

  const currentSpeed = length(nextVelocity);
  if (currentSpeed > p.zip_speed_limit_mps) nextVelocity = scale(nextVelocity, p.zip_speed_limit_mps / currentSpeed);
  native("SET_CHAR_VELOCITY", ped, nextVelocity.x, nextVelocity.y, nextVelocity.z);
}

function wallSide(ped, camera) {
  const p = CFG.parameters;
  const origin = charPosition(ped);
  if (!origin) return 0;
  const right = charRight(ped);
  const probeBase = add(origin, vec(0, 0, p.wall_run_height_m));
  const leftProbe = add(probeBase, scale(right, -p.wall_run_side_probe_m));
  const rightProbe = add(probeBase, scale(right, p.wall_run_side_probe_m));
  const leftBlocked = !isSphereVisible(camera, leftProbe);
  const rightBlocked = !isSphereVisible(camera, rightProbe);
  if (leftBlocked && !rightBlocked) return -1;
  if (rightBlocked && !leftBlocked) return 1;
  return 0;
}

function startWallRun(ped, camera) {
  const p = CFG.parameters;
  if (tether || !keyPressed("forward")) return;
  const velocity = charVelocity(ped);
  const forward = charForward(ped);
  const forwardSpeed = dot(velocity, forward);
  if (forwardSpeed < p.minimum_forward_speed_mps) return;
  const side = wallSide(ped, camera);
  if (!side) return;
  wallRun = { side: side, remainingMs: p.wall_run_duration_ms };
  log("Liberty Web Traversal: wall-run assist started; side", side);
  showTextBox("Wall run — tap Space again to jump away.");
}

function stopWallRun() {
  if (wallRun) log("Liberty Web Traversal: wall-run assist ended");
  wallRun = null;
}

function updateWallRun(ped, camera, dt, frameMs) {
  if (!wallRun) return;
  const p = CFG.parameters;
  if (keyPressed("wallrun_jump")) {
    const velocity = charVelocity(ped);
    const right = charRight(ped);
    const away = scale(right, -wallRun.side);
    native("SET_CHAR_VELOCITY", ped,
      velocity.x + away.x * p.wall_run_jump_impulse_mps,
      velocity.y + away.y * p.wall_run_jump_impulse_mps,
      Math.max(velocity.z, 0) + p.wall_run_up_impulse_mps);
    stopWallRun();
    showTextBox("Jumped clear of the wall.");
    return;
  }
  if (!keyPressed("forward") || !wallSide(ped, camera)) {
    stopWallRun();
    return;
  }

  wallRun.remainingMs -= frameMs;
  if (wallRun.remainingMs <= 0) {
    stopWallRun();
    return;
  }

  const forward = charForward(ped);
  const velocity = charVelocity(ped);
  native("SET_CHAR_VELOCITY", ped,
    forward.x * p.wall_run_speed_mps,
    forward.y * p.wall_run_speed_mps,
    Math.max(velocity.z, p.wall_run_upward_velocity_mps));
}

function tick() {
  const now = Date.now();
  const frameMs = Math.max(1, Math.min(CFG.parameters.max_frame_seconds * 1000, now - lastTickMs));
  const dt = frameMs / 1000;
  lastTickMs = now;

  const ped = native("GET_PLAYER_CHAR", 0);
  if (ped === undefined || ped === null || native("IS_CHAR_DEAD", ped) || !native("IS_CHAR_ON_FOOT", ped)) {
    if (tether) tether = null;
    if (wallRun) stopWallRun();
    return;
  }

  const camera = cameraFrame();
  if (!camera) return;

  if (!shownIntro) {
    showTextBox(CFG.parameters.tutorial_message);
    shownIntro = true;
    log("Liberty Web Traversal loaded on GTA IV", CLEO.hostVersion);
  }

  const wasWallRunning = wallRun !== null;
  if (keyPressed("attach_release")) toggleTether(ped, camera);
  if (!tether && wasWallRunning && wallRun) updateWallRun(ped, camera, dt, frameMs);
  else if (!tether && !wallRun && keyPressed("wallrun_jump")) startWallRun(ped, camera);
  updateTether(ped, dt);
}

async function main() {
  log("Liberty Web Traversal script started; expected host GTA IV");
  while (true) {
    try {
      tick();
    } catch (error) {
      log("Liberty Web Traversal tick error:", String(error));
    }
    await asyncWait(CFG.parameters.tick_ms);
  }
}

main();
