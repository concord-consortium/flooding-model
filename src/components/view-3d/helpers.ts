import { SimulationModel } from "../../models/simulation";
import * as THREE from "three";

export const DEFAULT_UP = new THREE.Vector3(0, 0, 1);

export const PLANE_WIDTH = 1;

export const planeHeight = (simulation: SimulationModel) =>
  simulation.config.modelHeight * PLANE_WIDTH / simulation.config.modelWidth;

// Ratio between model unit (meters) and 3D view distance unit (unitless).
export const mToViewUnitRatio = (simulation: SimulationModel) => PLANE_WIDTH / simulation.config.modelWidth;

// Ratio between model Z axis unit (meters) and 3D elevation (unitless, additionally scaled).
export const mToViewElevationUnit = (simulation: SimulationModel, elevation: number) => 
  elevation === 0 ? 0 : (elevation - simulation.config.minElevation) * mToViewUnitRatio(simulation) * simulation.config.view3dElevationMult;

export const getTexture = (imgSrcOrCanvas: string | HTMLCanvasElement) => {
  let source;
  let Texture = THREE.Texture;
  if (typeof imgSrcOrCanvas === "string") {
    source = document.createElement("img");
    source.src = imgSrcOrCanvas;
    source.onload = () => texture.needsUpdate = true;
  } else {
    source = imgSrcOrCanvas; // canvas
    Texture = THREE.CanvasTexture;
  }
  const texture = new Texture(source);
  return texture;
};
