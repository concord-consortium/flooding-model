import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { mToViewUnit } from "./helpers";
import * as THREE from "three";
import * as meshline from "threejs-meshline";
import { Interaction } from "../../models/ui";
// ESLint doesn't seem to detect ReactThreeFiber usage a few lines below.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { extend, ReactThreeFiber } from "react-three-fiber";

extend(meshline);
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      meshLine: ReactThreeFiber.Object3DNode<any, any>;
      meshLineMaterial: ReactThreeFiber.Object3DNode<any, any>;
    }
  }
}

const WIDTH = 0.0045;
const DASH_LEN = 0.15;
const SMOOTHING_RATIO = 0.4;
const Z_SHIFT = 0.005;

const HOVER_COLOR = "#dea1ac";
const COLOR = "#fc136c";

interface ILeveeSegmentProps {
  vertices: THREE.Vector3[];
  visible: boolean;
  dashed: boolean;
  hovered: boolean;
}
export const LeveeSegment: React.FC<ILeveeSegmentProps> = ({ vertices, visible, hovered, dashed }) => (
  <group>
    <mesh>
      <meshLine attach="geometry" vertices={vertices}/>
      <meshLineMaterial
        attach="material"
        opacity={hovered ? 1 : 0}
        lineWidth={WIDTH}
        color={HOVER_COLOR}
        transparent={true}
        depthTest={true}
      />
    </mesh>
    <mesh>
      <meshLine attach="geometry" vertices={vertices}/>
      <meshLineMaterial
        attach="material"
        opacity={visible ? 1 : 0}
        dashArray={dashed ? DASH_LEN : 0}
        lineWidth={WIDTH}
        color={COLOR}
        transparent={true}
        depthTest={true}
        dashRatio={0.5}
      />
    </mesh>
  </group>
);

export const Levees: React.FC = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();
  const unitConversionFactor = mToViewUnit(simulation);
  const riverBankSegments = simulation.riverBankSegments;
  const cellSize = simulation.config.cellSize;
  const view3d = simulation.config.view3d;

  const segments = useMemo(() => {
    const halfCell = cellSize * 0.5 * unitConversionFactor;
    const result = [];
    for (const segment of riverBankSegments) {
      const pos: THREE.Vector3[] = [];
      for (const cell of segment) {
        pos.push(new THREE.Vector3(
          cell.x * cellSize * unitConversionFactor + halfCell,
          cell.y * cellSize * unitConversionFactor + halfCell,
          (view3d ? cell.baseElevation * unitConversionFactor : 0) + Z_SHIFT
        ));
      }
      if (pos.length > 1) {
        const curveInterpolator = new THREE.CatmullRomCurve3(pos, false);
        // Limit number of output points to make lines more straight / smooth.
        result.push(curveInterpolator.getPoints(Math.round(pos.length * SMOOTHING_RATIO)));
      }
    }
    return result;
  }, [cellSize, unitConversionFactor, riverBankSegments, view3d]);

  const isLevee = useMemo(() => {
    // If one cell in the river bank segment is levee, then the whole segment is a levee. No need to check other cells.
    return riverBankSegments.map(segment => segment[0].isLevee);
    // exhaustive-deps would complain about simulation.cellsBaseStateFlag. It's necessary here, as this
    // flag marks that some changes have been made to cells (for performance reasons the whole array is not recreated).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riverBankSegments, simulation.cellsBaseStateFlag]);

  return (<>
    {
      segments.map((segment, idx) =>
        <LeveeSegment
          key={idx}
          vertices={segment}
          visible={isLevee[idx] || ui.interaction === Interaction.AddRemoveLevee}
          dashed={!isLevee[idx]}
          hovered={ui.interaction === Interaction.AddRemoveLevee && idx === ui.interactionTarget}
        />
      )}
  </>);
});
