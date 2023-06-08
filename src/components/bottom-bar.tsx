import React, { ChangeEvent } from "react";
import { BottomBarContainer, BottomBarWidgetGroup } from "../geohazard-components/bottom-bar/bottom-bar-container";
import { PlaybackControls } from "../geohazard-components/bottom-bar/playback-controls";
import { Slider } from "../geohazard-components/slider";
import { FormControl, MenuItem, Select } from "@material-ui/core";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import { RainIntensity, RiverStage } from "../types";
import { IconButton } from "../geohazard-components/bottom-bar/icon-button";
import { Interaction } from "../models/ui";
import LeveeIcon from "../assets/levee.svg";
import LeveeHighlightIcon from "../assets/levee_highlight.svg";
import { TimeSlider } from "./time-slider";
import { log } from "@concord-consortium/lara-interactive-api";

import css from "./bottom-bar.scss";

const rainIntensityMarks = [
  { value: RainIntensity.light, label: "Light" },
  { value: RainIntensity.medium, label: "Med" },
  { value: RainIntensity.heavy, label: "Heavy" },
  { value: RainIntensity.extreme, label: "Ext" },
];

const rainIntensityMarksWithoutExtreme = rainIntensityMarks.slice(0, -1);

const startingWaterLevelMarks = [
  { value: RiverStage.low, label: "Low" },
  { value: RiverStage.medium, label: "Med" },
  { value: RiverStage.high, label: "High" },
];

const stormDurationLabels: Record<number, string> = {
  1: "Short",
  2: "Medium",
  3: "Long",
  4: "Very Long"
};

export const BottomBar: React.FC = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();
  const config = simulation.config;

  const handleRainIntensityChange = (event: ChangeEvent, value: number) => {
    simulation.setRainIntensity(value);
  };

  const handleRainIntensityChangeCommitted = (event: ChangeEvent, value: number) => {
    const label = rainIntensityMarks.find(m => m.value === value)?.label;
    log("RainIntensityUpdated", { value: label });
  };

  const handleStartingWaterLevel = (event: ChangeEvent, value: number) => {
    simulation.setInitialWaterSaturation(value);
  };

  const handleStartingWaterLevelCommitted = (event: ChangeEvent, value: number) => {
    const label = startingWaterLevelMarks.find(m => m.value === value)?.label;
    log("StartingWaterLevelUpdated", { value: label });
  };

  const handleStormDurationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    simulation.setRainDurationInDays(value);
    log("StormDurationUpdated", { value: stormDurationLabels[value] });
  };

  const handleReload = () => {
    simulation.reload();
    ui.reload();
    log("SimulationReloaded");
  };

  const handleRestart = () => {
    simulation.restart();
    log("SimulationRestarted");
  };

  const handleStart = () => {
    simulation.start();
    log("SimulationStarted");
  };

  const handleStop = () => {
    simulation.stop();
    log("SimulationStopped");
  };

  const handleLeveeMode = () => {
    if (ui.interaction === Interaction.AddRemoveLevee) {
      ui.interaction = null;
      log("AddRemoveLeveeModeDisabled");
    } else {
      ui.interaction = Interaction.AddRemoveLevee;
      log("AddRemoveLeveeModeEnabled");
    }
  };

  return (
    <BottomBarContainer>
      <BottomBarWidgetGroup title="Amount of Rain" hoverable={true} className={css.amountOfRain}>
        <Slider
          data-testid="rain-intensity"
          value={simulation.rainIntensity}
          min={RainIntensity.light}
          max={config.extremeRain ? RainIntensity.extreme : RainIntensity.heavy}
          step={null} // restrict values to marks values
          marks={config.extremeRain ? rainIntensityMarks : rainIntensityMarksWithoutExtreme}
          disabled={simulation.simulationStarted}
          onChange={handleRainIntensityChange}
          onChangeCommitted={handleRainIntensityChangeCommitted}
        />
      </BottomBarWidgetGroup>
      <BottomBarWidgetGroup title={["Storm", "Duration"]} hoverable={true} className={css.stormDuration}>
        <div className={`${css.stormDurationSelect} ${simulation.simulationStarted ? css.disabled : ""}`} data-testid={"rain-duration"}>
          <FormControl variant="outlined">
            <Select
              MenuProps={{autoFocus: false, disableAutoFocusItem: true, disableEnforceFocus: true, disableAutoFocus: true}}
              className={css.selectElement}
              value={simulation.rainDurationInDays}
              onChange={handleStormDurationChange}
              data-testid={"rain-duration-select"}
            >
              <MenuItem value={1}>{ stormDurationLabels[1] }</MenuItem>
              <MenuItem value={2}>{ stormDurationLabels[2] }</MenuItem>
              <MenuItem value={3}>{ stormDurationLabels[3] }</MenuItem>
              { config.veryLongStorm && <MenuItem value={4}>{ stormDurationLabels[4] }</MenuItem> }
            </Select>
          </FormControl>
        </div>
      </BottomBarWidgetGroup>
      <BottomBarWidgetGroup title={["Starting", "Water Level"]} hoverable={true} className={css.startingWaterLevel}>
        <Slider
          data-testid="starting-water-level"
          value={simulation.initialWaterSaturation}
          min={RiverStage.low}
          max={RiverStage.high}
          step={null} // restrict values to marks values
          marks={startingWaterLevelMarks}
          disabled={simulation.simulationStarted}
          onChange={handleStartingWaterLevel}
          onChangeCommitted={handleStartingWaterLevelCommitted}
        />
      </BottomBarWidgetGroup>
      {
        config.maxLevees > 0 &&
        <BottomBarWidgetGroup hoverable={false}>
          <div className={css.leveesCount}>{ simulation.remainingLevees }</div>
          <IconButton
            icon={<LeveeIcon />} highlightIcon={<LeveeHighlightIcon />}
            buttonText="Levee" dataTest="levees-button" onClick={handleLeveeMode}
          />
        </BottomBarWidgetGroup>
      }
      <PlaybackControls
        onReload={handleReload}
        onRestart={handleRestart}
        onStart={handleStart}
        onStop={handleStop}
        playing={simulation.simulationRunning}
        startStopDisabled={!simulation.ready}
      />
      <BottomBarWidgetGroup title="Time (days)" hoverable={true} className={css.timeSlider}>
        <TimeSlider />
      </BottomBarWidgetGroup>
    </BottomBarContainer>
  );
});
