import React from "react";
import { CrossSectionSVGView } from "./cross-section-svg-view";
import { GaugeReadingGraph } from "./gauge-reading-graph";
import css from "./gauge-tab.scss";

interface IProps {
  gauge: number;
}

export const GaugeTab: React.FC<IProps> = ({ gauge }) => {
  return (
    <div className={css.gaugeTab}>
      <CrossSectionSVGView gauge={gauge} />
      <GaugeReadingGraph gauge={gauge} />
    </div>
  );
};
