import { GPUComputationRenderer, Variable } from 'three/examples/jsm/misc/GPUComputationRenderer';
import * as THREE from "three";
import { ShaderMaterial, WebGLRenderTarget } from "three";
import CalcWaterDepthShader from "./calc-water-depth-shader.glsl";
import CalcFluxShader from "./calc-flux-shader.glsl";
import ReadWaterLevelShader from "./read-water-level-shader.glsl";
import { onWebGLRendererAvailable } from "../../components/view-3d/webgl-renderer";
import { Cell } from "../cell";
import { IFloodingEngineConfig } from "./flooding-engine";
import { RiverStage } from '../simulation';

const isSafari = () => {
  return !!navigator.userAgent.match(/Safari/i) && !navigator.userAgent.match(/Chrome/i);
};

export class FloodingEngineGPU {
  public cells: Cell[];
  public config: IFloodingEngineConfig;

  public renderer: THREE.WebGLRenderer;
  public gpuCompute: GPUComputationRenderer;

  public waterOutputVariable: Variable;
  public fluxVariable: Variable;

  public readWaterLevelShader: ShaderMaterial;
  public readWaterLevelImage: Uint8Array;
  public readWaterLevelRenderTarget: THREE.WebGLRenderTarget;

  constructor(cells: Cell[], config: IFloodingEngineConfig) {
    this.cells = cells;
    this.config = config;

    onWebGLRendererAvailable((renderer) => {
      this.renderer = renderer;
      this.init();

      this.cellSize = config.cellSize;
      this.dampingFactor = config.dampingFactor !== undefined ? config.dampingFactor : 0.99;
      this.floodPermeabilityMult = config.floodPermeabilityMult !== undefined ? config.floodPermeabilityMult : 1;
      this.riverStageIncreaseSpeed = config.riverStageIncreaseSpeed !== undefined ? config.riverStageIncreaseSpeed : 0.125;
      this.dt = this.config.timeStep || 1;
      this.RiverStageHigh = RiverStage.high;
    });
  }

  public set cellSize(value: number) {
    this.waterOutputVariable.material.uniforms["cellSize"] = { value };
    this.fluxVariable.material.uniforms["cellSize"] = { value };
  }
  public get cellSize() {
    return this.waterOutputVariable.material.uniforms["cellSize"].value;
  }

  public set dampingFactor(value: number) {
    this.waterOutputVariable.material.uniforms["dampingFactor"] = { value };
    this.fluxVariable.material.uniforms["dampingFactor"] = { value };
  }
  public get dampingFactor() {
    return this.waterOutputVariable.material.uniforms["dampingFactor"].value;
  }

  public set floodPermeabilityMult(value: number) {
    this.waterOutputVariable.material.uniforms["floodPermeabilityMult"] = { value };
  }
  public get floodPermeabilityMult() {
    return this.waterOutputVariable.material.uniforms["floodPermeabilityMult"].value;
  }

  public set riverStageIncreaseSpeed(value: number) {
    this.waterOutputVariable.material.uniforms["riverStageIncreaseSpeed"] = { value };
  }
  public get riverStageIncreaseSpeed() {
    return this.waterOutputVariable.material.uniforms["riverStageIncreaseSpeed"].value;
  }

  public set dt(value: number) {
    this.waterOutputVariable.material.uniforms["dt"] = { value };
    this.fluxVariable.material.uniforms["dt"] = { value };
  }
  public get dt() {
    return this.waterOutputVariable.material.uniforms["dt"].value;
  }

  public set RiverStageHigh(value: number) {
    this.waterOutputVariable.material.uniforms["RiverStageHigh"] = { value };
  }
  public get RiverStageHigh() {
    return this.waterOutputVariable.material.uniforms["RiverStageHigh"].value;
  }

  public set waterSaturationIncrement(value: number) {
    this.waterOutputVariable.material.uniforms["waterSaturationIncrement"] = { value };
  }
  public get waterSaturationIncrement() {
    return this.waterOutputVariable.material.uniforms["waterSaturationIncrement"].value;
  }

  init() {
    this.gpuCompute = new GPUComputationRenderer(this.config.gridHeight, this.config.gridHeight, this.renderer);

    if (isSafari()) {
      this.gpuCompute.setDataType(THREE.HalfFloatType);
    }

    // .x => isRiver
    // .y => terrainElevation
    // .z => initialWaterSaturation
    // .w => permeability
    const cellPropsTexture = this.gpuCompute.createTexture();
    // .x => waterDepth
    // .y => waterSaturation
    const waterOutput0 = this.gpuCompute.createTexture();
    // .x => flux left
    // .y => flux top
    // .z => flux right
    // .w => flux bottom
    const fluxOutput0 = this.gpuCompute.createTexture();

    // Set initial values.
    this.cells.forEach((cell, idx) => {
      const i = idx * 4;
      cellPropsTexture.image.data[i] = cell.isRiver ? 1 : 0;
      cellPropsTexture.image.data[i + 1] = cell.terrainElevation;
      cellPropsTexture.image.data[i + 2] = cell.initialWaterSaturation;
      cellPropsTexture.image.data[i + 3] = cell.permeability;

      waterOutput0.image.data[i] = 0;
      waterOutput0.image.data[i + 1] = cell.initialWaterSaturation;

      fluxOutput0.image.data[i] = 0;
      fluxOutput0.image.data[i + 1] = 0;
      fluxOutput0.image.data[i + 2] = 0;
      fluxOutput0.image.data[i + 3] = 0;
    });
    // Setup variables.
    this.fluxVariable = this.gpuCompute.addVariable("textureFlux", CalcFluxShader, fluxOutput0);
    this.waterOutputVariable = this.gpuCompute.addVariable("textureWaterOutput", CalcWaterDepthShader, waterOutput0);
    // Setup variable dependencies.
    this.gpuCompute.setVariableDependencies(this.fluxVariable, [this.fluxVariable, this.waterOutputVariable]);
    this.gpuCompute.setVariableDependencies(this.waterOutputVariable, [ this.waterOutputVariable, this.fluxVariable ]);
    // Additional data used by variables.
    this.waterOutputVariable.material.uniforms["cellProps"] = { value: cellPropsTexture };
    this.fluxVariable.material.uniforms["cellProps"] = { value: cellPropsTexture };

    this.cellSize = 0;
    this.dampingFactor = 0;
    this.floodPermeabilityMult = 0;
    this.riverStageIncreaseSpeed = 0;
    this.dt = 0;
    this.RiverStageHigh = 0;
    this.waterSaturationIncrement = 0;

    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }

    // Create compute shader to read water level
    this.readWaterLevelShader = (this.gpuCompute as any).createShaderMaterial(ReadWaterLevelShader, {
      point1: {value: new THREE.Vector2()},
      levelTexture: {value: null}
    });

    // Create a 4x1 pixel image and a render target (Uint8, 4 channels, 1 byte per channel) to read water height and orientation.
    this.readWaterLevelImage = new Uint8Array(4 * 1 * 4);

    this.readWaterLevelRenderTarget = new THREE.WebGLRenderTarget(4, 1, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false
    });

    this.update();
  }

  public update() {
    // Do the gpu computation
    this.gpuCompute.compute();

    // Read data:
    // const currentRenderTarget = this.gpuCompute.getCurrentRenderTarget(this.waterOutputVariable) as WebGLRenderTarget;
    // this.readWaterLevelShader.uniforms["levelTexture"].value = currentRenderTarget.texture;
    
    // this.readWaterLevelShader.uniforms["point1"].value.set(104 / this.config.gridWidth, 104 / this.config.gridHeight);
    // this.gpuCompute.doRenderTarget(this.readWaterLevelShader, this.readWaterLevelRenderTarget);
    // this.renderer.readRenderTargetPixels(this.readWaterLevelRenderTarget, 0, 0, 4, 1, this.readWaterLevelImage);
    // const pixels = new Float32Array(this.readWaterLevelImage.buffer);  
    // console.log(pixels);
  }

  public getWaterDepthTexture() {
    return (this.gpuCompute.getCurrentRenderTarget(this.waterOutputVariable) as WebGLRenderTarget).texture;
  }
}
