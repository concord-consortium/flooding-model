import React from "react";
import { CrossSectionSVGView } from "./cross-section-svg-view";
import { GaugeReadingGraph } from "./gauge-reading-graph";
import {observer} from "mobx-react-lite";
import css from "./gauge-tab.scss";
import {useStores} from "../use-stores";

interface IProps {
  gauge: number;
}

export const GaugeTab: React.FC<IProps> = observer(({ gauge }) => {
  const { simulation } = useStores();
  if (!simulation.dataReady) {
    return null;
  }
  return (
    <div className={css.gaugeTab}>
      <CrossSectionSVGView gauge={gauge} />
      <GaugeReadingGraph gauge={gauge} />
    </div>
  );
});
