# Logged Events Reference

All events are logged via `@concord-consortium/lara-interactive-api` `log()` function.
Events are only sent when the simulation is embedded in LARA/Activity Player.
Use `?logMonitor=true` to view events in real time via the LogMonitor sidebar.

## Simulation Lifecycle

| Event | Parameters | When |
|-------|-----------|------|
| `SimulationStarted` | `{ rainIntensity, stormDuration, startingWaterLevel, simulationLength, presetName, activeTimePeriod, levees: [{ segmentIndex, x, y, leveeHeight }] }` | User clicks Start — parameters reflect state at button press |
| `SimulationStopped` | `{ outcome: { presetName, activeTimePeriod, timeInDays, timeInHours, floodAreaAcres, baselineGaugeReadings, finalGaugeReadings, baselineCrossSections, finalCrossSections, leveeWaterLevels } }` | User clicks Stop/Pause — includes outcome snapshot in case the session ends without restart |
| `SimulationRestarted` | — | User clicks Restart (bottom bar) |
| `SimulationReloaded` | — | User clicks Reload (bottom bar) |
| `SimulationEnded` | `{ reason: "ByItself" \| "SimulationRestarted" \| "SimulationReloaded" \| "TopBarReloadButtonClicked", outcome: { presetName, activeTimePeriod, timeInDays, timeInHours, floodAreaAcres, baselineGaugeReadings, finalGaugeReadings, baselineCrossSections, finalCrossSections, leveeWaterLevels } }` | Simulation ends naturally or user triggers restart/reload. Does NOT fire on pause. |
| `TopBarReloadButtonClicked` | — | User clicks Reload (top bar) |

## Mouse Interaction

| Event | Parameters | When |
|-------|-----------|------|
| `SimulationMouseEnter` | `{ clientX, clientY, percentX, percentY }` | Mouse enters the application viewport (includes 3D view, side panel, and top bar) |
| `SimulationMouseLeave` | `{ clientX, clientY, percentX, percentY }` | Mouse leaves the application viewport (includes 3D view, side panel, and top bar) |
| `SimulationClicked` | `{ clientX, clientY, percentX, percentY, terrainX, terrainY }` | Mouse click on the 3D terrain surface (only fires when the click hits the terrain mesh) |

## Levee Events

| Event | Parameters | When |
|-------|-----------|------|
| `LeveeAdded` | `{ x, y }` | User places a levee segment (normalized coordinates) |
| `LeveeRemoved` | `{ x, y }` | User removes a levee segment (normalized coordinates) |
| `AddRemoveLeveeModeEnabled` | — | User activates the levee tool |
| `AddRemoveLeveeModeDisabled` | — | User deactivates the levee tool |

## Parameter Changes

| Event | Parameters | When |
|-------|-----------|------|
| `RainIntensityUpdated` | `{ value }` | User changes rain intensity slider (Light/Med/Heavy/Ext) |
| `StartingWaterLevelUpdated` | `{ value }` | User changes starting water level slider (Low/Med/High) |
| `StormDurationUpdated` | `{ value }` | User changes storm duration dropdown (Short/Medium/Long/Very Long) |

## Map Controls

| Event | Parameters | When |
|-------|-----------|------|
| `MapLayerChanged` | `{ value }` | User changes the base map layer (street/topo/permeability) |
| `PlacesLayerShow` | — | User shows places layer |
| `PlacesLayerHidden` | — | User hides places layer |
| `POILayerShown` | — | User shows points of interest layer |
| `POILayerHidden` | — | User hides points of interest layer |
| `TimePeriodChanged` | `{ value }` | User changes time period (present/past/future) |
| `SidePanelTabChanged` | `{ value }` | User switches side panel tab |
| `ZoomInClicked` | — | User clicks zoom in button |
| `ZoomOutClicked` | — | User clicks zoom out button |
| `CameraResetClicked` | — | User clicks camera reset button |
| `TimeSliderChanged` | `{ day }` | User drags the time slider |
| `FullscreenEnabled` | — | User enters fullscreen mode |
| `FullscreenDisabled` | — | User exits fullscreen mode |

## Dialogs

| Event | Parameters | When |
|-------|-----------|------|
| `ShareDialogOpened` | — | User opens the Share dialog |
| `AboutDialogOpened` | — | User opens the About dialog |
