import { mToViewUnitRatio } from "./helpers";
import { InteractionHandler } from "./interaction-handler";
import { useStores } from "../../use-stores";
import { Event } from "three";

export const useShowCoordsInteraction: () => InteractionHandler = () => {
  const { simulation } = useStores();
  return {
    active: simulation.config.showCoordsOnClick,
    onPointerUp: (e: Event) => {
      const ratio = mToViewUnitRatio(simulation);
      const xM = e.point.x / ratio;
      const yM = e.point.y / ratio;
      const cell = simulation.cellAt(xM, yM);
      console.log(cell);
    }
  };
};
