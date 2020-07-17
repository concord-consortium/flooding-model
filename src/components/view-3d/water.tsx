import React  from "react";
import { Cell } from "../../models/cell";
import * as THREE from "three";
import { BufferAttribute } from "three";
import { SimulationModel } from "../../models/simulation";
import { mToViewUnit, PLANE_WIDTH, planeHeight } from "./helpers";
import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { useUpdate } from "react-three-fiber";

const vertexIdx = (cell: Cell, gridWidth: number, gridHeight: number) => (gridHeight - 1 - cell.y) * gridWidth + cell.x;

const MIN_WATER_DEPTH = 1e-4;

const setupElevation = (geometry: THREE.PlaneBufferGeometry, simulation: SimulationModel) => {
  const posArray = geometry.attributes.position.array as number[];
  const mult = mToViewUnit(simulation);
  // Apply height map to vertices of plane.
  for (const cell of simulation.cells) {
    const zAttrIdx = vertexIdx(cell, simulation.gridWidth, simulation.gridHeight) * 3 + 2;
    // .baseElevation doesn't include water depth.
    posArray[zAttrIdx] = cell.waterDepth > MIN_WATER_DEPTH ? cell.elevation * mult : -1e-4;
  }
  // This is needed only in 3D view for realistic shading. When view is locked to 2D, it should be disabled,
  // as it's pretty expensive (around 25ms for 300x300 grid on MBP 15" 2017).
  geometry.computeVertexNormals();
  (geometry.attributes.position as BufferAttribute).needsUpdate = true;
};

export const Water = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const height = planeHeight(simulation);

  const geometryRef = useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    geometry.setAttribute("color",
      new THREE.Float32BufferAttribute(new Array((simulation.gridWidth) * (simulation.gridHeight) * 4), 4)
    );
  }, [simulation.gridWidth, simulation.gridHeight]);

  useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    setupElevation(geometry, simulation);
  }, [simulation.cellsStateFlag], geometryRef);

  return (
    <mesh position={[PLANE_WIDTH * 0.5, height * 0.5, 0]} >
      <planeBufferGeometry
        attach="geometry"
        ref={geometryRef}
        center-x={0} center-y={0}
        args={[PLANE_WIDTH, height, simulation.gridWidth - 1, simulation.gridHeight - 1]}
      />
      <meshStandardMaterial attach="material" color={"#50acff"}/>
    </mesh>
  );
});
