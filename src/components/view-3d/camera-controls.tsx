import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { extend, useFrame, useThree } from "react-three-fiber";
import React, { useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PLANE_WIDTH, planeHeight } from "./helpers";
import { Vector3 } from "three";
// ESLint doesn't seem to detect ReactThreeFiber usage a few lines below.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ReactThreeFiber } from "react-three-fiber";

extend({ OrbitControls });

// See: https://github.com/react-spring/react-three-fiber/issues/130
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      orbitControls: ReactThreeFiber.Object3DNode<OrbitControls, typeof OrbitControls>;
    }
  }
}

export const CameraControls = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();
  const { camera, gl } = useThree();
  const ref = useRef<OrbitControls>();

  useFrame(() => ref.current && ref.current.update());

  return <orbitControls
    args={[camera, gl.domElement]}
    ref={ref}
    target={new Vector3(PLANE_WIDTH * 0.5, planeHeight(simulation) * 0.5, 0.2)}
    enableRotate={!ui.dragging} // disable rotation when something is being dragged
    enablePan={false}
    rotateSpeed={0.5}
    zoomSpeed={0.5}
    minDistance={0.8}
    maxDistance={5}
    maxPolarAngle={Math.PI * 0.45}
    minAzimuthAngle={-Math.PI * 0.4}
    maxAzimuthAngle={Math.PI * 0.4}
  />;
});
