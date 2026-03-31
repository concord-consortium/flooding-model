# Additional Log Events for Help Analysis

**Jira**: https://concord-consortium.atlassian.net/browse/FM-1

**Status**: **Closed**

## Overview

Integrate `@concord-consortium/log-monitor` into the Flooding Model, add `SimulationEnded` and enhanced `SimulationStarted` lifecycle events with flood outcome data, add mouse enter/leave/click tracking with terrain coordinates, update the LARA Interactive API dependency, and create a `LOGGED-EVENTS.md` reference document — giving researchers the telemetry needed to design behavior-based help overlays.

## Requirements

### Log Monitor Integration

- Add `@concord-consortium/log-monitor` as a dependency.
- Add `logMonitor: false` to `DEFAULT_CONFIG` in `src/config.ts` (URL-param enabled via `?logMonitor=true`).
- Create `src/log.ts` wrapper using `createLogWrapper` that conditionally wraps the LARA `log()` function.
- Migrate all `log` imports from `@concord-consortium/lara-interactive-api` to `src/log.ts` across all 8 source files.
- Render `<LogMonitor logFilePrefix="flooding-log-events" />` in the app when `config.logMonitor` is true.

### Dependency Update

- Update `@concord-consortium/lara-interactive-api` from `^1.9.2` to `^1.13.0` (latest published version, matching hurricane-model).

### Documentation

- Create a `LOGGED-EVENTS.md` file at the repo root containing a table of ALL logged events (both existing and new). Each row includes: event name, parameters/payload, and when/why it fires.
- Link to `LOGGED-EVENTS.md` from `README.md`.

### 1. New "SimulationEnded" Event

- Log a `SimulationEnded` event when the simulation ends naturally (reaches `simulationLength`), or when the user triggers a restart or reload. Pausing (Stop button) does NOT trigger `SimulationEnded`.
- Include a `reason` field: `"ByItself"`, `"SimulationRestarted"`, `"SimulationReloaded"`, `"TopBarReloadButtonClicked"`.
- Include an `outcome` field with simulation outcome data (see requirement #4).
- `SimulationStopped` now includes an `outcome` field with the same data structure, ensuring researchers have a snapshot if the student pauses and never resumes.

### 2. Enhanced "SimulationStarted" Parameters

- When `SimulationStarted` fires, include all essential simulation input parameters: rain intensity, storm duration, starting water level, simulation length, preset name, and active time period.
- Include levee state: list of all placed levees with their river bank segment index, normalized position (x/y), and levee height. Represents state at the moment the start button is pressed.

### 3. Mouse Enter/Leave and Click Events

- Log `SimulationMouseEnter` and `SimulationMouseLeave` with `{ clientX, clientY, percentX, percentY }` when the mouse enters/leaves the simulation container.
- Log `SimulationClicked` with the same position data plus `{ terrainX, terrainY }` in world meters (null if raycast misses). Suppressed when a levee action is triggered.
- Scroll-in/scroll-out visibility events are out of scope (handled at Activity Player level).

### 4. "SimulationEnded" Outcome Data for Flood

- The `outcome` field includes: `presetName`, `activeTimePeriod`, elapsed simulation time (`timeInDays`, `timeInHours`), water level at time=0 (baseline) and at simulation end for each levee position (empty array if none) and each town/gauge location, baseline and final cross-section states, plus final total flood area (acres).
- All floating-point values rounded to 4 decimal places.

## Technical Notes

### Simulation lifecycle

- `reload()` calls `restart()` internally — `SimulationEnded` fires in UI handlers (not model methods) to avoid double-firing. Exception: natural end (`"ByItself"`) fires from `rafCallback`.
- Race condition guard: `simulationEndedFired` flag prevents double-firing if natural end and user restart coincide. Reset on new run when `time === 0`.

### Baseline snapshot

- Captured at simulation start when `time === 0` (not on resume after pause).
- Cross-section states serialized eagerly into primitives to avoid stale MobX Cell references.
- Nullified/overwritten in `start()` to prevent stale data across runs.

### Terrain coordinates

- `SimulationClicked` uses `@react-three/fiber` raycaster via `onPointerUp`. Coordinates converted from Three.js space to world meters using `mToViewUnitRatio()`.
- `SimulationMouseEnter/Leave` use DOM events on the app container (no raycasting).

### LogMonitor layout

- Outer wrapper div with `display: flex` when `logMonitor` is true. Content wrapper uses `transform: scale(1)` to create a containing block for `position: fixed` children (bottom bar, nav controls).

### Top bar `onBeforeReload` pattern

- Top bar is a shared geohazard component without store access. `onBeforeReload` optional callback prop passes `SimulationEnded` firing from `app.tsx` where stores are accessible.

## Out of Scope

- "Show All" button logging — no such button exists in the flooding model's graph; copied from a different project.
- Water level tool logging — no student-facing water level tool exists.
- Scroll-in/scroll-out visibility events — handled in Activity Player code (per HURR-24 precedent).
- Backend logging service changes — client-side event emission only.
- Log-monitor package development — using existing published package.
- Help overlay implementation — separate story under DT-14 epic.

