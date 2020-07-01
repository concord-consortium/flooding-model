import React from "react";
import { BottomBarContainer, BottomBarWidgetGroup } from "../geohazard-components/bottom-bar";
import { PlaybackControls } from "../geohazard-components/playback-controls";
import Slider from "@material-ui/core/Slider";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import css from "./bottom-bar.scss";

export const BottomBar: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();

  const handleWaterLevelChange = (event: React.ChangeEvent, newValue: number) => {
    simulation.waterLevel = newValue;
  }

  return (
    <BottomBarContainer>
      <PlaybackControls
        onReload={simulation.reload}
        onRestart={simulation.restart}
        onStart={simulation.start}
        onStop={simulation.stop}
        playing={simulation.simulationRunning}
        startStopDisabled={!simulation.ready}
      />
      <BottomBarWidgetGroup>
        <div className={css.water}>
          Water level
          <Slider
            value={simulation.waterLevel}
            min={simulation.minRiverElevation - 1}
            max={simulation.maxElevation}
            onChange={handleWaterLevelChange}
          />
        </div>
      </BottomBarWidgetGroup>
    </BottomBarContainer>
  );
});
