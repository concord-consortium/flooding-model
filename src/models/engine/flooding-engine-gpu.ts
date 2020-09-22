import { GPUComputationRenderer, Variable } from 'three/examples/jsm/misc/GPUComputationRenderer';
import * as THREE from "three";
import { ShaderMaterial, WebGLRenderTarget } from "three";
import CalcWaterDepthShader from "./calc-water-depth-shader.glsl";
import ReadWaterLevelShader from "./read-water-level-shader.glsl";
import { onWebGLRendererAvailable } from "../../components/view-3d/webgl-renderer";
import { Cell } from "../cell";
import { IFloodingEngineConfig } from "./flooding-engine";

const isSafari = () => {
  return !!navigator.userAgent.match(/Safari/i) && !navigator.userAgent.match(/Chrome/i);
};

export class FloodingEngineGPU {
  public cells: Cell[];
  public config: IFloodingEngineConfig;

  public renderer: THREE.WebGLRenderer;
  public gpuCompute: GPUComputationRenderer;

  public waterDepthVariable: Variable;
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
    });
  }

  public set waterSaturationIncrement(value: number) {
    this.waterDepthVariable.material.uniforms["waterSaturationIncrement"] = { value };
  }

  public get waterSaturationIncrement() {
    return this.waterDepthVariable.material.uniforms["waterSaturationIncrement"].value;
  }

  init() {
    this.gpuCompute = new GPUComputationRenderer(this.config.gridHeight, this.config.gridHeight, this.renderer);

    if (isSafari()) {
      this.gpuCompute.setDataType(THREE.HalfFloatType);
    }

    // .x => isRiver
    // .y => terrainElevation
    // .z => initialWaterSaturation
    const cellPropsTexture = this.gpuCompute.createTexture();
    this.cells.forEach((cell, idx) => {
      const i = idx * 4;
      cellPropsTexture.image.data[i] = cell.isRiver ? 1 : 0;
      cellPropsTexture.image.data[i + 1] = cell.terrainElevation;
      cellPropsTexture.image.data[i + 2] = cell.initialWaterSaturation;
    });

    const waterDepth0 = this.gpuCompute.createTexture();
    this.waterDepthVariable = this.gpuCompute.addVariable("waterDepth", CalcWaterDepthShader, waterDepth0);
    this.gpuCompute.setVariableDependencies(this.waterDepthVariable, [this.waterDepthVariable]);
    this.waterDepthVariable.material.uniforms["waterSaturationIncrement"] = { value: 0 };
    this.waterDepthVariable.material.uniforms["cellProps"] = { value: cellPropsTexture };

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

    this.update(0);
  }

  public update(dt: number) {
    // Do the gpu computation
    // console.time("compute");
    this.gpuCompute.compute();
    // console.timeEnd("compute");

    // console.time("read");
    // const currentRenderTarget = this.gpuCompute.getCurrentRenderTarget(this.waterDepthVariable) as WebGLRenderTarget;
    // this.readWaterLevelShader.uniforms["levelTexture"].value = currentRenderTarget.texture;
    //
    // this.readWaterLevelShader.uniforms["point1"].value.set(0.5, 0.5);
    // this.gpuCompute.doRenderTarget(this.readWaterLevelShader, this.readWaterLevelRenderTarget);
    // this.renderer.readRenderTargetPixels(this.readWaterLevelRenderTarget, 0, 0, 4, 1, this.readWaterLevelImage);
    // let pixels = new Float32Array(this.readWaterLevelImage.buffer);
    //
    // this.readWaterLevelShader.uniforms["point1"].value.set(0.25, 0.25);
    // this.gpuCompute.doRenderTarget(this.readWaterLevelShader, this.readWaterLevelRenderTarget);
    // this.renderer.readRenderTargetPixels(this.readWaterLevelRenderTarget, 0, 0, 4, 1, this.readWaterLevelImage);
    // pixels = new Float32Array(this.readWaterLevelImage.buffer);
    // console.timeEnd("read");
    //
    // // Get orientation
    // console.log(pixels);
  }

  public getWaterDepthTexture() {
    return (this.gpuCompute.getCurrentRenderTarget(this.waterDepthVariable) as WebGLRenderTarget).texture;
  }
}
