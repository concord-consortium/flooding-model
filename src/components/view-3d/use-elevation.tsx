import * as THREE from "three";
import { useStores } from "../../use-stores";
import { useUpdate } from "react-three-fiber";
import { Cell } from "../../models/cell";
import { mToViewUnit } from "./helpers";
import { BufferAttribute } from "three";

const vertexIdx = (cell: Cell, gridWidth: number, gridHeight: number) => (gridHeight - 1 - cell.y) * gridWidth + cell.x;

interface IProps {
  includeWaterDepth: boolean;
  geometryRef?: React.MutableRefObject<THREE.PlaneBufferGeometry> | React.MutableRefObject<undefined>;
}

export const useElevation = ({ includeWaterDepth, geometryRef }: IProps) => {
  const { simulation } = useStores();

  return useUpdate<THREE.PlaneBufferGeometry>(geometry => {
      if (simulation.config.view3d) {
        const posArray = geometry.attributes.position.array as number[];
        const mult = mToViewUnit(simulation);
        // Apply height map to vertices of plane.
        for (const cell of simulation.cells) {
          const zAttrIdx = vertexIdx(cell, simulation.gridWidth, simulation.gridHeight) * 3 + 2;
          // .baseElevation doesn't include water depth.
          posArray[zAttrIdx] = (includeWaterDepth ? cell.elevation : cell.baseElevation) * mult;
        }
        geometry.computeVertexNormals();
        (geometry.attributes.position as BufferAttribute).needsUpdate = true;
      }
    },
    [simulation.config.view3d, includeWaterDepth ? simulation.cellsSimulationStateFlag : simulation.cellsBaseStateFlag],
    geometryRef?.current ? geometryRef : undefined
  );
};
