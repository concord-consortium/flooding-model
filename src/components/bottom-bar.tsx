import React, { ChangeEvent } from "react";
import { BottomBarContainer, BottomBarWidgetGroup } from "../geohazard-components/bottom-bar-container";
import { PlaybackControls } from "../geohazard-components/playback-controls";
import { Slider } from "../geohazard-components/slider";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import MoreIcon from "../geohazard-components/assets/more.svg";
import LessIcon from "../geohazard-components/assets/less.svg";
import {
  EXTREME_RAIN_INTENSITY, HEAVY_RAIN_INTENSITY, LIGHT_RAIN_INTENSITY, MEDIUM_RAIN_INTENSITY
} from "../models/simulation";

import css from "./bottom-bar.scss";

const rainIntensityMarks = [
  { value: LIGHT_RAIN_INTENSITY, label: "Light" },
  { value: MEDIUM_RAIN_INTENSITY, label: "Med" },
  { value: HEAVY_RAIN_INTENSITY, label: "Heavy" },
  { value: EXTREME_RAIN_INTENSITY, label: "Ext" },
];

const startingWaterLevelMarks = [
  { value: 0.0, label: "Low" },
  { value: 1/2, label: "Med" },
  { value: 1.0, label: "High" },
];

export const BottomBar: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();

  const handleRainIntensityChange = (event: ChangeEvent, value: number) => {
    simulation.setRainIntensity(value);
  };

  const handleStartingWaterLevel = (event: ChangeEvent, value: number) => {
    simulation.setInitialWaterLevel(value);
  };

  const handleIncreaseRainDuration = () => {
    simulation.setRainDurationInDays(simulation.rainDurationInDays + 1);
  };

  const handleDecreaseRainDuration = () => {
    simulation.setRainDurationInDays(simulation.rainDurationInDays - 1);
  };


  return (
    <BottomBarContainer>
      <BottomBarWidgetGroup title="Amount of Rain" hoverable={true} className={css.amountOfRain}>
        <Slider
          value={simulation.rainIntensity}
          min={LIGHT_RAIN_INTENSITY}
          max={EXTREME_RAIN_INTENSITY}
          step={null} // restrict values to marks values
          marks={rainIntensityMarks}
          onChange={handleRainIntensityChange}
        />
      </BottomBarWidgetGroup>
      <BottomBarWidgetGroup title={["Rain", "Duration"]} hoverable={true} className={css.rainDuration}>
        <div className={css.rainDurationValue}>
          { simulation.rainDurationInDays + (simulation.rainDurationInDays === 1 ? " day" : " days") }
        </div>
        <div className={css.rainDurationButtons}>
          <MoreIcon onClick={handleIncreaseRainDuration}/>
          <LessIcon onClick={handleDecreaseRainDuration}/>
        </div>
      </BottomBarWidgetGroup>
      <BottomBarWidgetGroup title={["Starting", "Water Level"]} hoverable={true} className={css.startingWaterLevel}>
        <Slider
          value={simulation.initialWaterLevel}
          min={0}
          max={1}
          step={null} // restrict values to marks values
          marks={startingWaterLevelMarks}
          onChange={handleStartingWaterLevel}
        />
      </BottomBarWidgetGroup>
      <PlaybackControls
        onReload={simulation.reload}
        onRestart={simulation.restart}
        onStart={simulation.start}
        onStop={simulation.stop}
        playing={simulation.simulationRunning}
        startStopDisabled={!simulation.ready}
      />
    </BottomBarContainer>
  );
});
