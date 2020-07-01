import { observable } from "mobx";

export enum Interaction {
  HoverOverDraggable = "HoverOverDraggable"
}

export class UIModel {
  @observable public interaction: Interaction | null = null;
  @observable public dragging: boolean = false;
}
