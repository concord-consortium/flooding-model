import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { Slider } from "../geohazard-components/slider";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { SNAPSHOT_INTERVAL } from "../models/snapshots-manager";
import { withStyles } from "@material-ui/core/styles";
import LinearProgress from "@material-ui/core/LinearProgress";
import { log } from "@concord-consortium/lara-interactive-api";
import css from "./time-slider.scss";

const BorderLinearProgress = withStyles(() => ({
  root: {
    height: 6,
    borderRadius: 3,
  },
  colorPrimary: {
    backgroundColor: "#c9c9c9"
  },
  bar: {
    borderRadius: 3,
    backgroundColor: "#50acff",
  },
}))(LinearProgress);

const SliderWithoutRail = withStyles(() => ({
  root: {
    marginTop: -5
  },
  mark: {
    width: 1,
    height: 1,
    borderRadius: 1,
    marginTop: 10
  },
  markLabel: {
    marginTop: 4
  },
  thumb: {
    height: 30,
    width: 30,
    backgroundColor: "#fff",
    marginTop: -16,
    marginLeft: -15,
  },
  rail: {
    display: "none"
  }
}))(Slider);

const LOADING_DELAY = 100; // ms

// Time slider is a combination of Slider with hidden rail and progress bar.
export const TimeSlider: React.FC = observer(function WrappedComponent() {
  const { simulation, snapshotsManager } = useStores();
  const timeoutId = useRef(0);
  const [val, setVal] = useState(simulation.timeInDays);

  useEffect(() => {
    setVal(simulation.timeInDays);
  }, [simulation.timeInDays]);

  const handleTimeChange = (event: ChangeEvent, value: number) => {
    value = Math.min(snapshotsManager.maxDay, value);
    setVal(value);
    window.clearTimeout(timeoutId.current);
    timeoutId.current = window.setTimeout(() => {
      snapshotsManager.restoreSnapshot(value);
    }, LOADING_DELAY);
  };

  const handleTimeChangeCommitted = (event: ChangeEvent, value: number) => {
    value = Math.min(snapshotsManager.maxDay, value);
    log("TimeSliderChanged", { day: value });
  };

  // this will generate marks array from 0 to config.simulationLength.
  const timeMarks = Array.from(Array(simulation.config.simulationLength + 1).keys()).map(v => ({ value: v, label: v}));
  const progress = 100 * snapshotsManager.maxDay / simulation.config.simulationLength;

  return (
    <div className={css.timeSlider}>
      <BorderLinearProgress variant="determinate" value={progress} className={css.progress} />
      <SliderWithoutRail
        data-testid="time-slider"
        value={val}
        min={0}
        max={timeMarks.length - 1}
        step={SNAPSHOT_INTERVAL / 24}
        marks={timeMarks}
        onChange={handleTimeChange}
        onChangeCommitted={handleTimeChangeCommitted}
      />
    </div>
  );
});
