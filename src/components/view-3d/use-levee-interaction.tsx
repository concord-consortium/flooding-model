import { mToViewUnit } from "./helpers";
import { InteractionHandler } from "./interaction-handler";
import { useStores } from "../../use-stores";
import { PointerEvent } from "react-three-fiber/canvas";
import { Interaction } from "../../models/ui";
import { Cell } from "../../models/cell";

const HOVER_DIST = 0.012; // for example 0.012 of the model width

export const useLeveeInteraction: () => InteractionHandler = () => {
  const { simulation, ui } = useStores();
  return {
    active: ui.interaction === Interaction.AddRemoveLevee,
    onPointerMove: (e: PointerEvent) => {
      const ratio = mToViewUnit(simulation);
      const xM = e.point.x / ratio;
      const yM = e.point.y / ratio;
      const cell = simulation.cellAt(xM, yM);
      if (!cell) {
        return;
      }
      const maxDist = HOVER_DIST * simulation.config.modelWidth / simulation.config.cellSize;
      const dist = {[cell.id]: 0};
      const queue = [ cell ];
      while (queue.length > 0) {
        const c = queue.shift() as Cell;
        if (c.isRiverBank) {
          if (ui.interactionTarget !== c.riverBankSegmentIdx) {
            // Don't update interactionTarget if not necessary for performance reasons. It'll trigger levees.tsx re-render.
            ui.interactionTarget = c.riverBankSegmentIdx;
          }
          return;
        }
        if (dist[c.id] < maxDist) {
          simulation.getCellNeighbors4(c).forEach(n => {
            if (!n.isRiver) {
              queue.push(n);
              dist[n.id] = dist[c.id] + 1;
            }
          });
        }
      }
      ui.interactionTarget = null;
    },
    onPointerUp: () => {
      if (ui.interactionTarget !== null) {
        const leveeHeight = simulation.config.leveeHeight;
        simulation.riverBankSegments[ui.interactionTarget].forEach(cell => {
          cell.leveeHeight = cell.isLevee ? 0 : leveeHeight;
        });
        simulation.updateCellsBaseStateFlag();
      }
    }
  };
};
