import React, { useEffect } from "react";
import { Canvas, useThree } from "react-three-fiber";
import { useStores } from "../../use-stores";
import { DEFAULT_UP } from "./helpers";
import { CameraControls } from "./camera-controls";
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
  // If pixelRatio is 2 or more, use a bit reduced value. It seems to be a good compromise between
  // rendering quality and performance (PJ: on my 2017 MacBook Pro 15", pixelRatio = 2 was causing visible FPS drop).
  const pixelRatio = window.devicePixelRatio > 1 ? Math.max(1, window.devicePixelRatio * 0.75) : 1;

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
    <Canvas camera={{ fov: 33, up: DEFAULT_UP }} pixelRatio={pixelRatio} >
      <ExtractWebGLRenderer />
      <CameraControls/>
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
  );
});
