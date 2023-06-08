import { observable, action, makeObservable } from "mobx";
import { ISimulationConfig } from "../config";
import { planeHeightFromConfig, PLANE_WIDTH } from "../components/view-3d/helpers";
import { Vector3 } from "three";

export enum Interaction {
  HoverOverDraggable = "HoverOverDraggable",
  AddRemoveLevee = "AddRemoveLevee"
}

// add some floating point error tolerance
const kFPZero = 0.0001;

export class UIModel {
  public config: ISimulationConfig;

  @observable public interaction: Interaction | null = null;
  @observable public interactionTarget: any = null;
  @observable public dragging = false;
  // Side container tab index.
  @observable public tabIndex = 0;

  // Main visual layer.
  @observable public mainLayer: "street" | "topo" | "permeability";
  @observable public poiLayerEnabled: boolean;
  @observable public placesLayerEnabled: boolean;

  // Camera
  @observable public defaultCameraPos: Vector3;
  @observable public cameraPos: Vector3;
  @observable public cameraTarget: Vector3;

  constructor(config: ISimulationConfig) {
    makeObservable(this);
    this.config = config;
    this.resetCameraPos();
    this.reload();
  }

  @action.bound public setTabIndex(idx: number) {
    this.tabIndex = idx;
  }

  @action.bound public setMainLayer(type: "street" | "topo" | "permeability") {
    this.mainLayer = type;
  }

  @action.bound public setCameraPos(newCameraPos: Vector3) {
    this.cameraPos = newCameraPos;
  }

  @action.bound public setCameraDistance(distance: number) {
    distance = Math.min(this.config.maxCameraDistance, Math.max(this.config.minCameraDistance, distance));
    const diff = this.cameraPos.clone().sub(this.cameraTarget).setLength(distance);
    this.cameraPos = this.cameraTarget.clone().add(diff);
  }

  public getCameraDistance() {
    return this.cameraPos.clone().sub(this.cameraTarget).length();
  }

  public canZoomIn() {
    return this.getCameraDistance() > this.config.minCameraDistance + kFPZero;
  }

  public canZoomOut() {
    return this.getCameraDistance() < this.config.maxCameraDistance - kFPZero;
  }

  public isCameraPosModified() {
    return this.cameraPos.clone().sub(this.defaultCameraPos).length() > kFPZero;
  }

  @action.bound public resetCameraPos() {
    this.defaultCameraPos = new Vector3(PLANE_WIDTH * 0.5, planeHeightFromConfig(this.config) * 0.5, 2);
    this.cameraPos = this.defaultCameraPos.clone();
    this.cameraTarget = new Vector3(PLANE_WIDTH * 0.5, planeHeightFromConfig(this.config) * 0.5, 0.0);
  }

  @action.bound public togglePoiLayer() {
    this.poiLayerEnabled = !this.poiLayerEnabled;
  }

  @action.bound public togglePlacesLayer() {
    this.placesLayerEnabled = !this.placesLayerEnabled;
  }

  @action.bound public reload() {
    const config = this.config;
    this.mainLayer = config.mapType;
    const tabIndex = config.tabs.indexOf(config.activeTab);
    this.tabIndex = tabIndex !== -1 ? tabIndex : 0;

    this.interaction = null;
    this.interactionTarget = null;
    this.poiLayerEnabled = true;
    this.placesLayerEnabled = true;
  }
}
