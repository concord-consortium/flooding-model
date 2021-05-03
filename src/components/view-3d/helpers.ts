import { SimulationModel } from "../../models/simulation";
import * as THREE from "three";
import { ISimulationConfig } from "../../config";

export const DEFAULT_UP = new THREE.Vector3(0, 0, 1);

export const PLANE_WIDTH = 1;

export const planeHeightFromConfig = (config: ISimulationConfig) =>
  config.modelHeight * PLANE_WIDTH / config.modelWidth;

export const planeHeight = (simulation: SimulationModel) => planeHeightFromConfig(simulation.config);

// Ratio between model unit (meters) and 3D view distance unit (unitless).
export const mToViewUnitRatio = (simulation: SimulationModel) => PLANE_WIDTH / simulation.config.modelWidth;

// Ratio between model Z axis unit (meters) and 3D elevation (unitless, additionally scaled).
export const mToViewElevationUnit = (simulation: SimulationModel, elevation: number) => 
  elevation === 0 ? 0 : (elevation - simulation.config.minElevation) * mToViewUnitRatio(simulation) * simulation.config.view3dElevationMult;

export const getTexture = (imgSrcOrCanvas: string | HTMLCanvasElement) => {
  let source;
  let texture: THREE.Texture | THREE.CanvasTexture;
  if (typeof imgSrcOrCanvas === "string") {
    source = document.createElement("img");
    source.src = imgSrcOrCanvas;
    source.onload = () => texture.needsUpdate = true;
    texture = new THREE.Texture(source);
  } else {
    source = imgSrcOrCanvas; // canvas
    texture = new THREE.CanvasTexture(source);
  }
  return texture;
};
