import React from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { Graph } from "./graph";
import { Header } from "./header";
import css from "./gauge-reading-graph.scss";

interface IProps {
  gauge: number;
}

const floodStageLine: Record<number, {color: string; value: number}> = {
  0: {
    color: "#FF9900",
    value: 13.6
  },
  1: {
    color: "#AF27FF",
    value: 15
  },
  2: {
    color: "#FF1B00",
    value: 28
  }
};

const graphMaxY: Record<number, number>  = {
  0: 34,
  1: 34,
  2: 40
};

export const GaugeReadingGraph: React.FC<IProps> = observer(({ gauge }) => {
  const { gaugeReadingDataset } = useStores();
  return (
    <div className={css.graphContainer}>
      <Header>River Stage vs. Time</Header>
      <div className={css.graph}>
        <Graph
          points={gaugeReadingDataset.getCurrentPoints(gauge)}
          yLabel="River Stage (feet)"
          maxY={graphMaxY[gauge]}
          floodStageY={floodStageLine[gauge].value}
          floodStageLineColor={floodStageLine[gauge].color}
        />
        <div className={css.legend}>
          <div className={css.line} style={{ background: floodStageLine[gauge].color }}/> Flood Stage
        </div>
      </div>
    </div>
  );
});
