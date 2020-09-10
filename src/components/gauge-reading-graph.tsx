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
  const { gaugeReadingDataset, simulation } = useStores();
  return (
    <div className={css.graphContainer}>
      <Header>River Stage vs. Time</Header>
      <div className={css.graph}>
        {/* .slice() as it seems ChartJS doesn't work well with MobX observable arrays. There's an error about
          maximum call stack exceeded. MobX observable array differs a bit from regular Array instance. */}
        <Graph points={gaugeReadingDataset.points[gauge].slice(0, simulation.timeInHours + 1)} yLabel="River Stage (feet)" maxY={34}/>
      </div>
    </div>
  );
});
