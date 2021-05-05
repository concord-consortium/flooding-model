import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { extend, useFrame, useThree } from "react-three-fiber";
import React, { useEffect, useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
  const { ui } = useStores();
  const { camera, gl } = useThree();
  const ref = useRef<OrbitControls>();

  useFrame(() => ref.current?.update());

  useEffect(() => {
    ref.current?.addEventListener("change", () => {
      ui.setCameraPos(camera.position.clone());
    });
  }, [ui, camera]);

  useEffect(() => {
    camera.position.copy(ui.cameraPos);
    ref.current?.update();
  }, [camera.position, ui.cameraPos]);

  return <orbitControls
    args={[camera, gl.domElement]}
    ref={ref}
    target={ui.cameraTarget}
    enableRotate={!ui.dragging} // disable rotation when something is being dragged
    enablePan={false}
    rotateSpeed={0.5}
    zoomSpeed={0.5}
    minDistance={ui.config.minCameraDistance}
    maxDistance={ui.config.maxCameraDistance}
    maxPolarAngle={Math.PI * 0.45}
    minAzimuthAngle={-Math.PI * 0.4}
    maxAzimuthAngle={Math.PI * 0.4}
  />;
});
