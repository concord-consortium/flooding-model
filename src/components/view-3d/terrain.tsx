import React, { useMemo } from "react";
import { Cell } from "../../models/cell";
import * as THREE from "three";
import { BufferAttribute } from "three";
import { SimulationModel } from "../../models/simulation";
import { mToViewUnit, PLANE_WIDTH, planeHeight } from "./helpers";
import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { useUpdate } from "react-three-fiber";
import { getEventHandlers, InteractionHandler } from "./interaction-handler";
import { useShowCoordsInteraction } from "./use-show-coords-interaction";

const vertexIdx = (cell: Cell, gridWidth: number, gridHeight: number) => (gridHeight - 1 - cell.y) * gridWidth + cell.x;

const setupElevation = (geometry: THREE.PlaneBufferGeometry, simulation: SimulationModel) => {
  const posArray = geometry.attributes.position.array as number[];
  const mult = mToViewUnit(simulation);
  // Apply height map to vertices of plane.
  simulation.cells.forEach(cell => {
    const zAttrIdx = vertexIdx(cell, simulation.gridWidth, simulation.gridHeight) * 3 + 2;
    // .baseElevation doesn't include water depth.
    posArray[zAttrIdx] = cell.baseElevation * mult;
  });
  geometry.computeVertexNormals();
  (geometry.attributes.position as BufferAttribute).needsUpdate = true;
};

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

  const geometryRef = useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    setupElevation(geometry, simulation);
  }, [simulation.cellsBaseElevationFlag]);

  const interactions: InteractionHandler[] = [
    useShowCoordsInteraction()
  ];

  // Note that getEventHandlers won't return event handlers if it's not necessary. This is important,
  // as adding even an empty event handler enables raycasting machinery in react-three-fiber and it has big
  // performance cost in case of fairly complex terrain mesh. That's why when all the interactions are disabled,
  // eventHandlers will be an empty object and nothing will be attached to the terrain mesh.
  const eventHandlers = getEventHandlers(interactions);

  const textureSrc = simulation.config.texture;
  const texture = useMemo(() => getTexture(textureSrc), [textureSrc]);

  return (
    <mesh position={[PLANE_WIDTH * 0.5, height * 0.5, 0]} {...eventHandlers}>
      <planeBufferGeometry
        attach="geometry"
        ref={geometryRef}
        center-x={0} center-y={0}
        args={[PLANE_WIDTH, height, simulation.gridWidth - 1, simulation.gridHeight - 1]}
      />
      {
        texture ?
          <meshLambertMaterial attach="material" map={texture} /> :
          <meshLambertMaterial attach="material" />
      }
    </mesh>
  );
});
