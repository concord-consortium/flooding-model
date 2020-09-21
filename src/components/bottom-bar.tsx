import React, { ChangeEvent } from "react";
import { BottomBarContainer, BottomBarWidgetGroup } from "../geohazard-components/bottom-bar-container";
import { PlaybackControls } from "../geohazard-components/playback-controls";
import { Slider } from "../geohazard-components/slider";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import MoreIcon from "../geohazard-components/assets/more.svg";
import LessIcon from "../geohazard-components/assets/less.svg";
import { RainIntensity, RiverStage } from "../models/simulation";
import { IconButton } from "../geohazard-components/icon-button";
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

  const handleIncreaseRainDuration = () => {
    simulation.setRainDurationInDays(simulation.rainDurationInDays + 1);
  };

  const handleDecreaseRainDuration = () => {
    simulation.setRainDurationInDays(simulation.rainDurationInDays - 1);
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
      <BottomBarWidgetGroup title={["Rain", "Duration"]} hoverable={true} className={css.rainDuration}>
        <div className={css.rainDurationValue}>
          { simulation.rainDurationInDays + (simulation.rainDurationInDays === 1 ? " day" : " days") }
        </div>
        <div className={`${css.rainDurationButtons} ${simulation.simulationStarted ? css.disabled : ""}`} data-test={"rain-duration"}>
          <LessIcon onClick={handleDecreaseRainDuration} data-test="increase-rain-duration"/>
          <MoreIcon onClick={handleIncreaseRainDuration} data-test="decrease-rain-duration"/>
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
