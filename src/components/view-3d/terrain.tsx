import React, { useMemo } from "react";
import { PLANE_WIDTH, planeHeight, getTexture } from "./helpers";
import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { getEventHandlers, InteractionHandler } from "./interaction-handler";
import { useElevation } from "./use-elevation";

interface IProps {
  textureImg: string | null;
  interactions?: InteractionHandler[];
}
export const Terrain: React.FC<IProps> = observer(function WrappedComponent({ textureImg, interactions }) {
  const { simulation } = useStores();
  const config = simulation.config;
  const height = planeHeight(simulation);
  // This hook will setup terrain elevation WITHOUT water depth. Note that in 2D view it won't do anything.
  const geometryRef = useElevation({ includeWaterDepth: false });
  // Note that getEventHandlers won't return event handlers if it's not necessary. This is important,
  // as adding even an empty event handler enables raycasting machinery in react-three-fiber and it has big
  // performance cost in case of fairly complex terrain mesh. That's why when all the interactions are disabled,
  // eventHandlers will be an empty object and nothing will be attached to the terrain mesh.
  const eventHandlers = getEventHandlers(interactions || []);

  const texture = useMemo(() => textureImg && getTexture(textureImg), [textureImg]);

  // When flat 2D view is used, the plane geometry can have just one segment each direction.
  let widthSegments = 1;
  let heightSegments = 1;
  if (simulation.config.view3d) {
    widthSegments = simulation.gridWidth - 1;
    heightSegments = simulation.gridHeight - 1;
  }

  const materialProps = { attach: "material", map: texture || null, transparent: true };
  const textureImgIsLabels = textureImg === config.placeLabelsImg || textureImg === config.pointsOfInterestImg;

  return (
    <mesh position={[PLANE_WIDTH * 0.5, height * 0.5, textureImgIsLabels ? .002 : 0]} {...eventHandlers}>
      <planeBufferGeometry
        attach="geometry"
        ref={geometryRef}
        center-x={0} center-y={0}
        args={[PLANE_WIDTH, height, widthSegments, heightSegments]}
      />
      {
        // meshBasicMaterial material doesn't require any light which is necessary, as 2D doesn't have any lights and shading.
        simulation.config.view3d ? <meshStandardMaterial {...materialProps} /> : <meshBasicMaterial {...materialProps} />
      }
    </mesh>
  );
});
