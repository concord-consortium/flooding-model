import React, { useEffect, useLayoutEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useStores } from "../../use-stores";
import { DEFAULT_UP } from "./helpers";
import { CameraControls, PerspectiveCamera } from "@react-three/drei";
import { Terrain } from "./terrain";
import { Water } from "./water";
import { Levees } from "./levees";
import Shutterbug from "shutterbug";
import { Gauges } from "./gauges";
import { InteractionHandler } from "./interaction-handler";
import { useShowCoordsInteraction } from "./use-show-coords-interaction";
import { useLeveeInteraction } from "./use-levee-interaction";
import { observer } from "mobx-react-lite";
import { ExtractWebGLRenderer } from "./webgl-renderer";

// This needs to be a separate component, as useThree depends on context provided by <Canvas> component.
const ShutterbugSupport = () => {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const handler = () => {
      gl.render(scene, camera);
    };
    Shutterbug.on("saycheese", handler);
    return () => Shutterbug.off("saycheese", handler);
  }, [gl, scene, camera]);
  return null;
};

export const View3d = observer(() => {
  const { simulation, ui } = useStores();
  const config = simulation.config;
  const controlsRef = useRef<CameraControls>(null);

  const handleControlsCreated = (controls: CameraControls) => {
    controls.setTarget(...ui.cameraTarget.toArray());
    controls.setPosition(...ui.cameraPos.toArray());
  };

  const handleCameraPositionUpdated = () => {
    if (controlsRef.current?.camera.position) {
      ui.setCameraPos(controlsRef.current?.camera.position.clone());
    }
  };

  useLayoutEffect(() => {
    if (controlsRef.current?.camera.position && !ui.cameraPos.equals(controlsRef.current?.camera.position)) {
      controlsRef.current?.setPosition(...ui.cameraPos.toArray(), true);
    }
  }, [ui.cameraPos]);

  const terrainInteractions: InteractionHandler[] = [
    useShowCoordsInteraction(),
    useLeveeInteraction()
  ];

  let mainLayer;
  if (ui.mainLayer === "street") {
    mainLayer = config.streetTexture;
  } else if (ui.mainLayer === "topo") {
    mainLayer = config.topoTexture;
  } else {
    mainLayer = config.permeabilityTexture;
  }

  return (
    /* eslint-disable react/no-unknown-property */
    // See: https://github.com/jsx-eslint/eslint-plugin-react/issues/3423
    <Canvas camera={{ manual: true }} flat>
      <ExtractWebGLRenderer />
      <PerspectiveCamera makeDefault={true} fov={33} up={DEFAULT_UP} />
      <CameraControls
        ref={controlsRef}
        onUpdate={handleControlsCreated} // on creation, set initial camera position and target
        onEnd={handleCameraPositionUpdated} // on end of interaction, update camera position
        enabled={!ui.dragging} // disable rotation when something is being dragged
        minDistance={ui.config.minCameraDistance}
        maxDistance={ui.config.maxCameraDistance}
        maxPolarAngle={Math.PI * 0.45}
        minAzimuthAngle={-Math.PI * 0.4}
        maxAzimuthAngle={Math.PI * 0.4}
      />
      {
        config.view3d &&
        <>
          <pointLight position={[0.5, 0.5, 3]} intensity={0.5}/>
          <ambientLight intensity={0.5} />
        </>
      }
      <Terrain interactions={terrainInteractions} textureImg={mainLayer} />
      <Water />
      <Levees />
      <Gauges />
      { config.scaleImg && <Terrain textureImg={config.scaleImg} /> }
      { ui.placesLayerEnabled && config.placeLabelsImg && <Terrain textureImg={config.placeLabelsImg} /> }
      { ui.poiLayerEnabled && config.pointsOfInterestImg && <Terrain textureImg={config.pointsOfInterestImg} /> }
      <ShutterbugSupport/>
    </Canvas>
    /* eslint-enable react/no-unknown-property */
  );
});
