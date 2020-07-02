import React, { useMemo } from "react";
import { Cell } from "../../models/cell";
import { ISimulationConfig } from "../../config";
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

const WHITE = [1, 1, 1, 1];

const setVertexColor = (
  colArray: number[], cell: Cell, gridWidth: number, gridHeight: number, config: ISimulationConfig
) => {
  const idx = vertexIdx(cell, gridWidth, gridHeight) * 4;
  let color;
  if (cell.isWater) {
    color = config.riverColor;
  } else {
    color = WHITE
  }
  colArray[idx] = color[0];
  colArray[idx + 1] = color[1];
  colArray[idx + 2] = color[2];
  colArray[idx + 3] = color[3];
};

const updateColors = (geometry: THREE.PlaneBufferGeometry, simulation: SimulationModel) => {
  const colArray = geometry.attributes.color.array as number[];
  simulation.cells.forEach(cell => {
    setVertexColor(colArray, cell, simulation.gridWidth, simulation.gridHeight, simulation.config);
  });
  (geometry.attributes.color as BufferAttribute).needsUpdate = true;
};

const setupElevation = (geometry: THREE.PlaneBufferGeometry, simulation: SimulationModel) => {
  const posArray = geometry.attributes.position.array as number[];
  const mult = mToViewUnit(simulation);
  // Apply height map to vertices of plane.
  simulation.cells.forEach(cell => {
    const zAttrIdx = vertexIdx(cell, simulation.gridWidth, simulation.gridHeight) * 3 + 2;
    posArray[zAttrIdx] = (simulation.config.renderWaterLevel && cell.isWater ? simulation.waterLevel : cell.elevation) * mult;
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

export const Terrain = observer(function WrappedComponent(props) {
  const { simulation } = useStores();
  const height = planeHeight(simulation);

  const geometryRef = useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    geometry.setAttribute("color",
      new THREE.Float32BufferAttribute(new Array((simulation.gridWidth) * (simulation.gridHeight) * 4), 4)
    );
  }, [simulation.gridWidth, simulation.gridHeight]);

  useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    setupElevation(geometry, simulation);
  }, [simulation.cellsElevationFlag], geometryRef);

  useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    updateColors(geometry, simulation);
  }, [simulation.cellsStateFlag], geometryRef);

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
          <meshLambertMaterial attach="material" map={texture} vertexColors={true} /> :
          <meshLambertMaterial attach="material" vertexColors={true} />
      }
    </mesh>
  )
});
