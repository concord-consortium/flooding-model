import React, { useEffect } from "react";
import { Canvas, useThree } from "react-three-fiber";
import { useStores } from "../../use-stores";
import { DEFAULT_UP, PLANE_WIDTH, planeHeight } from "./helpers";
import { CameraControls } from "./camera-controls";
import { Terrain } from "./terrain";
import { Water } from "./water";
import { Levees } from "./levees";
import Shutterbug from "shutterbug";
import { Gauges } from "./gauges";
import { InteractionHandler } from "./interaction-handler";
import { useShowCoordsInteraction } from "./use-show-coords-interaction";
import { useLeveeInteraction } from "./use-levee-interaction";

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

export const View3d = () => {
  const stores = useStores();
  const simulation = stores.simulation;
  const config = simulation.config;
  // 0.4999 is used, as 0.5 causes a weird rotation of the camera due to constraints enforced by OrbitControls config.
  const cameraPos: [number, number, number] = [PLANE_WIDTH * 0.5, planeHeight(simulation) * 0.4999, PLANE_WIDTH * 2];
  // return <div>Lol</div>;

  // If pixelRatio is 2 or more, use a bit reduced value. It seems to be a good compromise between
  // rendering quality and performance (PJ: on my 2017 MacBook Pro 15", pixelRatio = 2 was causing visible FPS drop).
  const pixelRatio = window.devicePixelRatio > 1 ? Math.max(1, window.devicePixelRatio * 0.75) : 1;

  const terrainInteractions: InteractionHandler[] = [
    useShowCoordsInteraction(),
    useLeveeInteraction()
  ];

  return (
    <Canvas camera={{ fov: 33, up: DEFAULT_UP, position: cameraPos }} pixelRatio={pixelRatio} >
      <CameraControls/>
      {
        simulation.config.view3d &&
        <>
          <hemisphereLight args={[0xC6C2B6, 0x3A403B, 1.2]} up={DEFAULT_UP} intensity={1.0}/>
          <pointLight position={[0.5, 0.5, 3]} intensity={0.3}/>
        </>
      }
      <Terrain interactions={terrainInteractions} textureImg={config.texture} />
      <Water />
      <Levees />
      <Gauges />
      { config.scaleImg && <Terrain textureImg={config.scaleImg} /> }
      { config.placeLabelsImg && <Terrain textureImg={config.placeLabelsImg} /> }
      { config.pointsOfInterestImg && <Terrain textureImg={config.pointsOfInterestImg} /> }
      <ShutterbugSupport/>
    </Canvas>
  );
};
