import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";

import css from "./time-display.scss";

export const TimeDisplay: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();

  const days = Math.floor(simulation.timeInHours / 24);
  const hours = simulation.timeInHours % 24;

  return (
    <div className={`${css.timeDisplay} ${css[simulation.weather]}`}>
      <div className={css.text}>
        <div>{ days } { days === 1 ? "day" : "days" }</div>
        <div>{ hours } { hours === 1 ? "hour" : "hours" }</div>
      </div>
    </div>
  );
});
