import React, { useMemo, useRef } from "react";
import { Cell } from "../../models/cell";
import * as THREE from "three";
import { BufferAttribute } from "three";
import { SimulationModel } from "../../models/simulation";
import { PLANE_WIDTH, planeHeight } from "./helpers";
import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { useUpdate } from "react-three-fiber";
import { useElevation } from "./use-elevation";
// Very simple shaders. They won't work great in 3D view, as there's no lighting there. But 3D view is used only
// for tests models at the moment. If 3D view ever gets more useful, these shaders should be updated to include
// some light calculations / reflections.
import waterVertexShader from "./water-vertex.glsl";
import waterFragmentShader from "./water-fragment.glsl";

const vertexIdx = (cell: Cell, gridWidth: number, gridHeight: number) => (gridHeight - 1 - cell.y) * gridWidth + cell.x;

const WATER_COL = new THREE.Vector3(80/255, 172/255, 255/255);
const MAX_OPACITY = 0.75;
// Water below this depth will have opacity between MAX_OPACITY and 0. It ensures that water appears and disappears smoothly.
const MAX_OPACITY_WATER_DEPTH = 0.5; // m

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

  useElevation({ includeWaterDepth: true, geometryRef });

  useUpdate<THREE.PlaneBufferGeometry>(geometry => {
    setupAlpha(geometry, simulation);
  }, [simulation.cellsSimulationStateFlag], geometryRef.current ? geometryRef : undefined);


  // ShaderMaterial could be theoretically created using JSX, but somehow it doesn't want to update uniforms correctly.
  // It seems that uniform is cached somewhere. Note that each frame simulation.waterDepthTexture might be different
  // as GPU computation swaps render targets.
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: {value: WATER_COL},
        waterDepth: {value: null}
      },
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true
    });
  }, []);
  material.uniforms.waterDepth.value = simulation.waterDepthTexture;

  return (
    // In 2D view per-vertex elevation is never set, so it's necessary to keep this plane a bit higher than terrain plane.
    <mesh position={[PLANE_WIDTH * 0.5, height * 0.5, simulation.config.view3d ? 0 : 0.001 ]} material={material}>
      <planeBufferGeometry
        attach="geometry"
        ref={geometryRef}
        center-x={0} center-y={0}
        args={[PLANE_WIDTH, height, simulation.gridWidth - 1, simulation.gridHeight - 1]}
      />
    </mesh>
  );
});
