import * as THREE from "three";
import { useStores } from "../../use-stores";
import { Cell } from "../../models/cell";
import { mToViewElevationUnit } from "./helpers";
import { BufferAttribute } from "three";
import { useLayoutEffect } from "react";

const vertexIdx = (cell: Cell, gridWidth: number, gridHeight: number) => (gridHeight - 1 - cell.y) * gridWidth + cell.x;

interface IProps {
  includeWaterDepth: boolean;
  geometryRef: React.RefObject<THREE.PlaneGeometry>;
}

export const useElevation = ({ includeWaterDepth, geometryRef }: IProps) => {
  const { simulation } = useStores();

  return useLayoutEffect(() => {
    const geometry = geometryRef?.current;
    if (geometry && simulation.config.view3d) {
      const posArray = geometry.attributes.position.array as number[];
      // Apply height map to vertices of plane.
      for (const cell of simulation.cells) {
        const zAttrIdx = vertexIdx(cell, simulation.gridWidth, simulation.gridHeight) * 3 + 2;
        // .baseElevation doesn't include water depth.
        posArray[zAttrIdx] = cell.isEdge ? 0 : mToViewElevationUnit(simulation, includeWaterDepth ? cell.elevation : cell.baseElevation);
      }
      if (!includeWaterDepth) {
        // It doesn't make sense to recalculate normals for water surface, as it's pretty much flat.
        geometry.computeVertexNormals();
      }
      (geometry.attributes.position as BufferAttribute).needsUpdate = true;
    }
  }, [simulation.config.view3d, includeWaterDepth, includeWaterDepth ? simulation.cellsSimulationStateFlag : simulation.cellsBaseStateFlag]
  );
};
