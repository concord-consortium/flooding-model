import React from "react";
import { Cell } from "../../models/cell";
import * as THREE from "three";
import { BufferAttribute } from "three";
import { SimulationModel } from "../../models/simulation";
import { mToViewUnit, PLANE_WIDTH, planeHeight } from "./helpers";
import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { useUpdate } from "react-three-fiber";
// Very simple shaders. They won't work great in 3D view, as there's no lightning there. But 3D view is used only
// for tests models at the moment. If 3D view ever gets more useful, these shaders should be updated to include
// some light calculations / reflections.
import waterVertexShader from "./water-vertex.glsl";
import waterFragmentShader from "./water-fragment.glsl";

const vertexIdx = (cell: Cell, gridWidth: number, gridHeight: number) => (gridHeight - 1 - cell.y) * gridWidth + cell.x;

const WATER_COL = new THREE.Vector3(80/255, 172/255, 255/255);
const MAX_OPACITY = 0.75;
// Water below this depth will have opacity between MAX_OPACITY and 0. It ensures that water appears and disappears smoothly.
const MAX_OPACITY_WATER_DEPTH = 0.5; // m

const setupElevation = (geometry: THREE.PlaneBufferGeometry, simulation: SimulationModel) => {
  const posArray = geometry.attributes.position.array as number[];
  const mult = mToViewUnit(simulation);
  // Apply height map to vertices of plane.
  for (const cell of simulation.cells) {
    const zAttrIdx = vertexIdx(cell, simulation.gridWidth, simulation.gridHeight) * 3 + 2;
    // .baseElevation doesn't include water depth.
    posArray[zAttrIdx] = cell.elevation * mult;
  }
  geometry.computeVertexNormals();
  (geometry.attributes.position as BufferAttribute).needsUpdate = true;
};

const setupAlpha = (geometry: THREE.PlaneBufferGeometry, simulation: SimulationModel) => {
  const alphaArray = geometry.attributes.alpha.array as number[];
  for (const cell of simulation.cells) {
    const vertIdx = vertexIdx(cell, simulation.gridWidth, simulation.gridHeight);
    alphaArray[vertIdx] = cell.waterDepth > MAX_OPACITY_WATER_DEPTH ? MAX_OPACITY : (cell.waterDepth / MAX_OPACITY_WATER_DEPTH) * MAX_OPACITY;
  }
  (geometry.attributes.alpha as BufferAttribute).needsUpdate = true;
};

export const Water = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const height = planeHeight(simulation);

  const geometryRef = useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    geometry.setAttribute("alpha",
      new THREE.Float32BufferAttribute(new Array((simulation.gridWidth) * (simulation.gridHeight)), 1)
    );
  }, [simulation.gridWidth, simulation.gridHeight]);

  // Elevation update is only necessary in 3D view.
  useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    if (simulation.config.view3d) {
      setupElevation(geometry, simulation);
    }
  }, [simulation.config.view3d, simulation.cellsStateFlag], geometryRef.current ? geometryRef : undefined);

  useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    setupAlpha(geometry, simulation);
  }, [simulation.cellsStateFlag], geometryRef.current ? geometryRef : undefined);

  const uniforms = {
    color: {value: WATER_COL}
  };

  return (
    // In 2D view per-vertex elevation is never set, so it's necessary to keep this plane a bit higher than terrain plane.
    <mesh position={[PLANE_WIDTH * 0.5, height * 0.5, simulation.config.view3d ? 0 : 0.001 ]} >
      <planeBufferGeometry
        attach="geometry"
        ref={geometryRef}
        center-x={0} center-y={0}
        args={[PLANE_WIDTH, height, simulation.gridWidth - 1, simulation.gridHeight - 1]}
      />
      {/* Note that standard ThreeJS materials don't let us specify alpha per vertex. That's why it's necessary to use ShaderMaterial and custom shaders. */}
      <shaderMaterial
        attach="material"
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
});
