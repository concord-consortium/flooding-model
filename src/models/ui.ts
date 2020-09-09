import { observable, action } from "mobx";

export enum Interaction {
  HoverOverDraggable = "HoverOverDraggable",
  AddRemoveLevee = "AddRemoveLevee"
}

export class UIModel {
  @observable public interaction: Interaction | null = null;
  @observable public interactionTarget: any = null;
  @observable public dragging = false;
  // Side container tab index.
  @observable public tabIndex = 0;

  // Main visual layer.
  @observable public mainLayer: "street" | "topo" | "permeability" = "street";
  @observable public poiLayerEnabled = true;
  @observable public placesLayerEnabled = true;

  @action.bound public setTabIndex(idx: number) {
    this.tabIndex = idx;
  }

  @action.bound public setMainLayer(type: "street" | "topo" | "permeability") {
    this.mainLayer = type;
  }

  @action.bound public togglePoiLayer() {
    this.poiLayerEnabled = !this.poiLayerEnabled;
  }

  @action.bound public togglePlacesLayer() {
    this.placesLayerEnabled = !this.placesLayerEnabled;
  }

  @action.bound public reload() {
    this.interaction = null;
    this.interactionTarget = null;
  }
}
