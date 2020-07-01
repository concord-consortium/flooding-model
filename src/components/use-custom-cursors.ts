import { useStores } from "../use-stores";
import { Interaction } from "../models/ui";
import { useEffect } from "react";

const interactionCursors: {[key in Interaction]?: string} = {
  [Interaction.HoverOverDraggable]: "grab"
};

export const useCustomCursor = () => {
  const { ui } = useStores();

  useEffect(() => {
    if (ui.dragging) {
      document.body.style.cursor = "move";
      return;
    }
    if (ui.interaction && interactionCursors[ui.interaction]) {
      document.body.style.cursor = interactionCursors[ui.interaction]!;
      return;
    }
    document.body.style.cursor = "default";
  }, [ui.interaction, ui.dragging]);
};
