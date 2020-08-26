import { observable } from "mobx";

export enum Interaction {
  HoverOverDraggable = "HoverOverDraggable",
  AddRemoveLevee = "AddRemoveLevee"
}

export class UIModel {
  @observable public interaction: Interaction | null = null;
  @observable public dragging = false;
}
