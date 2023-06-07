// So we can import CSS modules.
declare module "*.sass";
declare module "*.scss";
declare module "*.glsl";
declare module "*.svg" {
  const content: any;
  export default content;
}
declare module "*.png" {
  const value: string;
  export = value;
}
declare module "shutterbug";

import { MeshLineMaterial, MeshLineGeometry } from "meshline";
import { Object3DNode, MaterialNode } from "@react-three/fiber";
declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: Object3DNode<MeshLineGeometry, typeof MeshLineGeometry>
    meshLineMaterial: MaterialNode<MeshLineMaterial, typeof MeshLineMaterial>
  }
}
