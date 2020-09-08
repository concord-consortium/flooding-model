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

  @action.bound public setTabIndex(idx: number) {
    this.tabIndex = idx;
  }

  @action.bound public reload() {
    this.interaction = null;
    this.interactionTarget = null;
  }
}
