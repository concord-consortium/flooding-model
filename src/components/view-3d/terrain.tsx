import React, { useMemo } from "react";
import * as THREE from "three";
import { PLANE_WIDTH, planeHeight } from "./helpers";
import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { getEventHandlers, InteractionHandler } from "./interaction-handler";
import { useElevation } from "./use-elevation";
import { useLeveeInteraction } from "./use-levee-interaction";
import { useShowCoordsInteraction } from "./use-show-coords-interaction";

const getTexture = (imgSrcOrCanvas: string | HTMLCanvasElement) => {
  let source;
  let Texture = THREE.Texture;
  if (!imgSrcOrCanvas) {
    return null;
  }
  if (typeof imgSrcOrCanvas === "string") {
    source = document.createElement("img");
    source.src = imgSrcOrCanvas;
    source.onload = () => texture.needsUpdate = true;
  } else {
    source = imgSrcOrCanvas; // canvas
    Texture = THREE.CanvasTexture;
  }
  const texture = new Texture(source);
  return texture;
};

export const Terrain = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const height = planeHeight(simulation);
  // This hook will setup terrain elevation WITHOUT water depth.
  const geometryRef = useElevation({ includeWaterDepth: false });

  const interactions: InteractionHandler[] = [
    useShowCoordsInteraction(),
    useLeveeInteraction()
  ];
  // Note that getEventHandlers won't return event handlers if it's not necessary. This is important,
  // as adding even an empty event handler enables raycasting machinery in react-three-fiber and it has big
  // performance cost in case of fairly complex terrain mesh. That's why when all the interactions are disabled,
  // eventHandlers will be an empty object and nothing will be attached to the terrain mesh.
  const eventHandlers = getEventHandlers(interactions);

  const textureSrc = simulation.config.texture;
  const texture = useMemo(() => textureSrc && getTexture(textureSrc), [textureSrc]);

  return (
    <mesh position={[PLANE_WIDTH * 0.5, height * 0.5, 0]} {...eventHandlers}>
      <planeBufferGeometry
        attach="geometry"
        ref={geometryRef}
        center-x={0} center-y={0}
        args={[PLANE_WIDTH, height, simulation.gridWidth - 1, simulation.gridHeight - 1]}
      />
      {
        simulation.config.view3d ?
          <meshStandardMaterial attach="material" map={texture || null} /> :
          <meshBasicMaterial attach="material" map={texture || null} /> // this material doesn't require any light
      }
    </mesh>
  );
});
