import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useStores } from "../../use-stores";
import { mToViewUnitRatio, mToViewElevationUnit } from "./helpers";
import * as THREE from "three";
import { MeshLineMaterial, MeshLineGeometry } from "meshline";
import { Interaction } from "../../models/ui";
import { extend, ReactThreeFiber } from "@react-three/fiber";

extend({ MeshLineGeometry, MeshLineMaterial });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      meshLine: ReactThreeFiber.Object3DNode<any, any>;
      meshLineMaterial: ReactThreeFiber.Object3DNode<any, any>;
    }
  }
}

const WIDTH = 0.018;
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
  visible ?
    /* eslint-disable react/no-unknown-property */
    <group>
      <mesh>
        <meshLineGeometry points={vertices.map(v => v.toArray())} />
        <meshLineMaterial
          opacity={hovered ? 1 : 0}
          lineWidth={WIDTH}
          color={HOVER_COLOR}
          transparent={true}
        />
      </mesh>
      <mesh>
        <meshLineGeometry points={vertices.map(v => v.toArray())} />
        <meshLineMaterial
          attach="material"
          opacity={visible ? 1 : 0}
          dashArray={dashed ? DASH_LEN : 0}
          lineWidth={WIDTH}
          color={COLOR}
          transparent={true}
          dashRatio={0.5}
        />
      </mesh>
    </group>
    :
    null
    /* eslint-enable react/no-unknown-property */
);

export const Levees: React.FC = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();
  const unitConversionFactor = mToViewUnitRatio(simulation);
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
          (view3d ? mToViewElevationUnit(simulation, cell.baseElevation) : 0) + Z_SHIFT
        ));
      }
      if (pos.length > 1) {
        const curveInterpolator = new THREE.CatmullRomCurve3(pos, false);
        // Limit number of output points to make lines more straight / smooth.
        result.push(curveInterpolator.getPoints(Math.round(pos.length * SMOOTHING_RATIO)));
      } else {
        result.push([]);
      }
    }
    return result;
  }, [cellSize, unitConversionFactor, simulation, riverBankSegments, view3d]);

  const isLevee = useMemo(() => {
    // cellsBaseStateFlag flag marks that some changes have been made to cells (for performance reasons the whole cells
    // array is not observable). The statement below is gratuitous, it just prevents eslint exhaustive-deps rule from
    // complaining about unnecessary variable in the dependencies array.
    // eslint-disable-next-line no-unused-expressions
    simulation.cellsBaseStateFlag;
    // If one cell in the river bank segment is levee, then the whole segment is a levee. No need to check other cells.
    // Don't check first or the last one cell, as these can be shared between two segments.
    return riverBankSegments.map(segment => segment[1]?.isLevee);

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
