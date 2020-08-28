import { observable, action } from "mobx";

export enum Interaction {
  HoverOverDraggable = "HoverOverDraggable",
  AddRemoveLevee = "AddRemoveLevee"
}

export class UIModel {
  @observable public interaction: Interaction | null = null;
  @observable public interactionTarget: any = null;
  @observable public dragging = false;

  @action.bound public reload() {
    this.interaction = null;
    this.interactionTarget = null;
  }
}
