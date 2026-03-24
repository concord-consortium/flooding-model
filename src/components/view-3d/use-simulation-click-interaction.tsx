import { mToViewUnitRatio } from "./helpers";
import { InteractionHandler } from "./interaction-handler";
import { useStores } from "../../use-stores";
import { log } from "../../log";
import { Interaction } from "../../models/ui";
import { Event } from "three";

export const useSimulationClickInteraction: () => InteractionHandler = () => {
  const { simulation, ui } = useStores();
  return {
    active: true,
    onPointerUp: (e: Event) => {
      // Suppress click logging when the click triggers a levee action
      if (ui.interaction === Interaction.AddRemoveLevee && ui.interactionTarget !== null) {
        return;
      }
      const nativeEvent = e.nativeEvent as MouseEvent;
      // In r3f, nativeEvent.currentTarget is null (event dispatch is complete).
      // Use the canvas element (target) and its parent container for bounding rect.
      const canvas = nativeEvent.target as HTMLElement;
      const container = canvas?.parentElement;
      const rect = container?.getBoundingClientRect();

      const position: Record<string, number | null> = {
        clientX: nativeEvent.clientX,
        clientY: nativeEvent.clientY,
        percentX: rect ? Math.round(((nativeEvent.clientX - rect.left) / rect.width) * 100) : null,
        percentY: rect ? Math.round(((nativeEvent.clientY - rect.top) / rect.height) * 100) : null,
        terrainX: null,
        terrainY: null
      };

      // e.point is provided by @react-three/fiber's raycaster
      if (e.point) {
        const ratio = mToViewUnitRatio(simulation);
        position.terrainX = Math.round(e.point.x / ratio);
        position.terrainY = Math.round(e.point.y / ratio);
      }

      log("SimulationClicked", position);
    }
  };
};
