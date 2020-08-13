import React from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { Graph } from "./graph";
import css from "./flood-area-graph.scss";

export const FloodAreaGraph: React.FC = observer(() => {
  const { floodAreaDataset } = useStores();

  return (
    <div className={css.graph}>
      {/* .slice() as it seems ChartJS doesn't work well with MobX observable arrays. There's an error about
          maximum call stack exceeded. MobX observable array differs a bit from regular Array instance. */}
      <Graph points={floodAreaDataset.points.slice()} yLabel="Flood Area (acres)" maxY={3400} />
    </div>
  );
});
