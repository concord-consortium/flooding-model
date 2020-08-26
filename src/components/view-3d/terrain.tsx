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
import { Interaction, UIModel } from "../../models/ui";

const vertexIdx = (cell: Cell, gridWidth: number, gridHeight: number) => (gridHeight - 1 - cell.y) * gridWidth + cell.x;

const setupElevation = (geometry: THREE.PlaneBufferGeometry, simulation: SimulationModel) => {
  const posArray = geometry.attributes.position.array as number[];
  const mult = mToViewUnit(simulation);
  // Apply height map to vertices of plane.
  for (const cell of simulation.cells) {
    const zAttrIdx = vertexIdx(cell, simulation.gridWidth, simulation.gridHeight) * 3 + 2;
    // .baseElevation doesn't include water depth.
    posArray[zAttrIdx] = cell.baseElevation * mult;
  }
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

const TEXTURE_COL = [1, 1, 1, 1];
const RIVER_BANK = [2, 0.2, 1, 1];

const setVertexColor = (colArray: number[], cell: Cell, gridWidth: number, gridHeight: number, interaction: Interaction | null) => {
  const idx = vertexIdx(cell, gridWidth, gridHeight) * 4;
  let color;
  if (interaction === Interaction.AddRemoveLevee && cell.isRiverBankMarker) {
    color = RIVER_BANK;
  } else {
    color = TEXTURE_COL;
  }
  colArray[idx] = color[0];
  colArray[idx + 1] = color[1];
  colArray[idx + 2] = color[2];
  colArray[idx + 3] = color[3];
};

const updateColors = (geometry: THREE.PlaneBufferGeometry, simulation: SimulationModel, ui: UIModel) => {
  const colArray = geometry.attributes.color.array as number[];
  simulation.cells.forEach(cell => {
    setVertexColor(colArray, cell, simulation.gridWidth, simulation.gridHeight, ui.interaction);
  });
  (geometry.attributes.color as BufferAttribute).needsUpdate = true;
};


export const Terrain = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();
  const height = planeHeight(simulation);

  const geometryRef = useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    if (simulation.config.view3d) {
      setupElevation(geometry, simulation);
    }
    geometry.setAttribute("color",
      new THREE.Float32BufferAttribute(new Array((simulation.gridWidth) * (simulation.gridHeight) * 4), 4)
    );
  }, [simulation.config.view3d, simulation.cellsBaseElevationFlag]);

  useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    updateColors(geometry, simulation, ui);
  }, [simulation.cellsBaseElevationFlag, ui.interaction], geometryRef.current ? geometryRef : undefined);

  const interactions: InteractionHandler[] = [
    useShowCoordsInteraction()
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
          <meshStandardMaterial attach="material" map={texture || null} vertexColors={true} /> :
          <meshBasicMaterial attach="material" map={texture || null} vertexColors={true} /> // this material doesn't require any light
      }
    </mesh>
  );
});
