import React from "react";
import { BottomBarContainer } from "../geohazard-components/bottom-bar-container";
import { PlaybackControls } from "../geohazard-components/playback-controls";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";

export const BottomBar: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();

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
    </BottomBarContainer>
  );
});
