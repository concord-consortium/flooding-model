import React from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { Graph } from "./graph";
import { Header } from "./header";
import css from "./gauge-reading-graph.scss";

interface IProps {
  gauge: number;
}

export const GaugeReadingGraph: React.FC<IProps> = observer(({ gauge }) => {
  const { gaugeReadingDataset } = useStores();
  return (
    <div className={css.graphContainer}>
      <Header>River Stage vs. Time</Header>
      <div className={css.graph}>
        <Graph points={gaugeReadingDataset.getCurrentPoints(gauge)} yLabel="River Stage (feet)" maxY={34}/>
      </div>
    </div>
  );
});
