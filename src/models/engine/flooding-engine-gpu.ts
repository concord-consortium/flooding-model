import { GPUComputationRenderer, Variable } from 'three/examples/jsm/misc/GPUComputationRenderer';
import * as THREE from "three";
import { ShaderMaterial, WebGLRenderTarget } from "three";
import CalcWaterDepthShader from "./calc-water-depth-shader.glsl";
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
  }
  public get cellSize() {
    return this.waterOutputVariable.material.uniforms["cellSize"].value;
  }

  public set dampingFactor(value: number) {
    this.waterOutputVariable.material.uniforms["dampingFactor"] = { value };
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

    // Set initial values.
    this.cells.forEach((cell, idx) => {
      const i = idx * 4;
      cellPropsTexture.image.data[i] = cell.isRiver ? 1 : 0;
      cellPropsTexture.image.data[i + 1] = cell.terrainElevation;
      cellPropsTexture.image.data[i + 2] = cell.initialWaterSaturation;
      cellPropsTexture.image.data[i + 3] = cell.permeability;

      waterOutput0.image.data[i] = 0;
      waterOutput0.image.data[i + 1] = cell.initialWaterSaturation;
    });

    this.waterOutputVariable = this.gpuCompute.addVariable("waterOutput", CalcWaterDepthShader, waterOutput0);
    this.gpuCompute.setVariableDependencies(this.waterOutputVariable, [this.waterOutputVariable]);
    this.waterOutputVariable.material.uniforms["waterSaturationIncrement"] = { value: 0 };
    this.waterOutputVariable.material.uniforms["cellProps"] = { value: cellPropsTexture };

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
    console.time("compute");
    this.gpuCompute.compute();
    console.timeEnd("compute");

    console.time("read");
    const currentRenderTarget = this.gpuCompute.getCurrentRenderTarget(this.waterOutputVariable) as WebGLRenderTarget;
    this.readWaterLevelShader.uniforms["levelTexture"].value = currentRenderTarget.texture;
    //
    this.readWaterLevelShader.uniforms["point1"].value.set(0.5, 0.5);
    this.gpuCompute.doRenderTarget(this.readWaterLevelShader, this.readWaterLevelRenderTarget);
    this.renderer.readRenderTargetPixels(this.readWaterLevelRenderTarget, 0, 0, 4, 1, this.readWaterLevelImage);
    let pixels = new Float32Array(this.readWaterLevelImage.buffer);
    
    this.readWaterLevelShader.uniforms["point1"].value.set(0.25, 0.25);
    this.gpuCompute.doRenderTarget(this.readWaterLevelShader, this.readWaterLevelRenderTarget);
    this.renderer.readRenderTargetPixels(this.readWaterLevelRenderTarget, 0, 0, 4, 1, this.readWaterLevelImage);
    pixels = new Float32Array(this.readWaterLevelImage.buffer);
    console.timeEnd("read");
    
    // Get orientation
    // console.log(pixels);
  }

  public getWaterDepthTexture() {
    return (this.gpuCompute.getCurrentRenderTarget(this.waterOutputVariable) as WebGLRenderTarget).texture;
  }
}
