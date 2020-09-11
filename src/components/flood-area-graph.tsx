import React from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { Graph } from "./graph";
import { Header } from "./header";
import css from "./flood-area-graph.scss";

export const FloodAreaGraph: React.FC = observer(() => {
  const { floodAreaDataset } = useStores();
  return (
    <div className={css.graph}>
      <Header>Graph: Total Flood Area vs. Time</Header>
      {/* .slice() as it seems ChartJS doesn't work well with MobX observable arrays. There's an error about
          maximum call stack exceeded. MobX observable array differs a bit from regular Array instance. */}
      <Graph points={floodAreaDataset.getCurrentPoints()} yLabel="Flood Area (acres)" maxY={3400} />
    </div>
  );
});
