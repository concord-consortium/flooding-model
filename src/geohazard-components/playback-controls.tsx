import React from "react";
import { BottomBarWidgetGroup } from "./bottom-bar";
import Button from "@material-ui/core/Button";
import ReloadIcon from "./assets/reload.svg";
import RestartIcon from "./assets/restart.svg";
import PauseIcon from "./assets/pause.svg";
import StartIcon from "./assets/start.svg";
import css from "./playback-controls.scss";

interface IProps {
  onReload?: () => void;
  onRestart?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  playing?: boolean;
  startStopDisabled?: boolean;
}

export const PlaybackControls: React.FC<IProps> = ({ onReload, onRestart, onStart, onStop, playing, startStopDisabled }) => {
  const handleStartPause = () => {
    if (playing) {
      onStop?.();
    } else {
      onStart?.();
    }
  };

  return (
    <>
      {
        (onReload || onRestart) &&
        <BottomBarWidgetGroup>
          {
            onReload &&
            <Button
              className={css.playbackButton}
              data-test="reload-button"
              onClick={onReload}
              disableRipple={true}
            >
              <span><ReloadIcon/> Reload</span>
            </Button>
          }
          {
            onRestart &&
            <Button
              className={css.playbackButton}
              data-test="restart-button"
              onClick={onRestart}
              disableRipple={true}
            >
              <span><RestartIcon/> Restart</span>
            </Button>
          }
        </BottomBarWidgetGroup>
      }
      {
        (onStart && onStop) &&
        <BottomBarWidgetGroup className={css.startStop}>
          <Button
            onClick={handleStartPause}
            disabled={startStopDisabled}
            className={css.playbackButton}
            data-test="start-stop-button"
            disableRipple={true}
          >
            { playing ? <span><PauseIcon/> Stop</span> : <span><StartIcon /> Start</span> }
          </Button>
        </BottomBarWidgetGroup>
      }
    </>
  );
}
