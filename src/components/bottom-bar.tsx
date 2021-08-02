import React, { ChangeEvent } from "react";
import { BottomBarContainer, BottomBarWidgetGroup } from "../geohazard-components/bottom-bar/bottom-bar-container";
import { PlaybackControls } from "../geohazard-components/bottom-bar/playback-controls";
import { Slider } from "../geohazard-components/slider";
import { FormControl, MenuItem, Select } from "@material-ui/core";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { RainIntensity, RiverStage } from "../models/simulation";
import { IconButton } from "../geohazard-components/bottom-bar/icon-button";
import { Interaction } from "../models/ui";
import LeveeIcon from "../assets/levee.svg";
import LeveeHighlightIcon from "../assets/levee_highlight.svg";
import { TimeSlider } from "./time-slider";
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

export const BottomBar: React.FC = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();
  const config = simulation.config;

  const handleRainIntensityChange = (event: ChangeEvent, value: number) => {
    simulation.setRainIntensity(value);
  };

  const handleStartingWaterLevel = (event: ChangeEvent, value: number) => {
    simulation.setInitialWaterSaturation(value);
  };

  const handleStormDurationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    simulation.setRainDurationInDays(Number(event.target.value));
  };

  const handleReload = () => {
    simulation.reload();
    ui.reload();
  };

  const handleLeveeMode = () => {
    if (ui.interaction === Interaction.AddRemoveLevee) {
      ui.interaction = null;
    } else {
      ui.interaction = Interaction.AddRemoveLevee;
    }
  };

  return (
    <BottomBarContainer>
      <BottomBarWidgetGroup title="Amount of Rain" hoverable={true} className={css.amountOfRain}>
        <Slider
          data-test="rain-intensity"
          value={simulation.rainIntensity}
          min={RainIntensity.light}
          max={config.extremeRain ? RainIntensity.extreme : RainIntensity.heavy}
          step={null} // restrict values to marks values
          marks={config.extremeRain ? rainIntensityMarks : rainIntensityMarksWithoutExtreme}
          disabled={simulation.simulationStarted}
          onChange={handleRainIntensityChange}
        />
      </BottomBarWidgetGroup>
      <BottomBarWidgetGroup title={["Storm", "Duration"]} hoverable={true} className={css.stormDuration}>
        <div className={`${css.stormDurationSelect} ${simulation.simulationStarted ? css.disabled : ""}`} data-test={"rain-duration"}>
          <FormControl variant="outlined">
            <Select className={css.selectElement} value={simulation.rainDurationInDays} onChange={handleStormDurationChange} data-test={"rain-duration-select"}>
              <MenuItem value={1}>Short</MenuItem>
              <MenuItem value={2}>Medium</MenuItem>
              <MenuItem value={3}>Long</MenuItem>
              { config.veryLongStorm && <MenuItem value={4}>Very Long</MenuItem> }
            </Select>
          </FormControl>
        </div>
      </BottomBarWidgetGroup>
      <BottomBarWidgetGroup title={["Starting", "Water Level"]} hoverable={true} className={css.startingWaterLevel}>
        <Slider
          data-test="starting-water-level"
          value={simulation.initialWaterSaturation}
          min={RiverStage.low}
          max={RiverStage.high}
          step={null} // restrict values to marks values
          marks={startingWaterLevelMarks}
          disabled={simulation.simulationStarted}
          onChange={handleStartingWaterLevel}
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
        onRestart={simulation.restart}
        onStart={simulation.start}
        onStop={simulation.stop}
        playing={simulation.simulationRunning}
        startStopDisabled={!simulation.ready}
      />
      <BottomBarWidgetGroup title="Time (days)" hoverable={true} className={css.timeSlider}>
        <TimeSlider />
      </BottomBarWidgetGroup>
    </BottomBarContainer>
  );
});
