import React from "react";
import { useThree } from "react-three-fiber";
import EventEmitter from "eventemitter3";
import * as THREE from "three";

const emit = new EventEmitter();
const eventName = "webGLRendererAvailable";
let renderer: THREE.WebGLRenderer | null = null;

export const onWebGLRendererAvailable = (handler: (renderer: THREE.WebGLRenderer) => void) => {
  if (renderer) {
    handler(renderer);
  } else {
    emit.once(eventName, handler);
  }
};

// Small pseudo-component used to extract the current WebGLRenderer.
// GPGPU computations need to use the same Renderer instance so it's possible to share textures.
// See: https://github.com/pmndrs/react-three-fiber/issues/685
export const ExtractWebGLRenderer: React.FC = () => {
  const { gl } = useThree();
  if (gl && gl !== renderer) {
    renderer = gl;
    emit.emit(eventName, renderer);
  }
  return null;
};
