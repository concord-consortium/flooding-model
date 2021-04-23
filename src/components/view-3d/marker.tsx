import React, { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { mToViewUnitRatio, mToViewElevationUnit, getTexture } from "./helpers";
import { useStores } from "../../use-stores";
import { PointerEvent } from "react-three-fiber/canvas";

interface IProps {
  // Image src or HTML Canvas that is going to be used as a texture source.
  markerImg: string | HTMLCanvasElement;
  position: {x: number, y: number};
  // Width relative to the plane/terrain width.
  width?: number;
  // Height relative to the plane/terrain width.
  height?: number;
  anchorX?: number;
  anchorY?: number;
  // Optional highlight image that we'll be activated on hover or when marker is considered to be "active".
  markerHighlightImg?: string | HTMLCanvasElement;
  active?: boolean;
  onClick?: () => void;
}

export const Marker: React.FC<IProps> = observer(function WrappedComponent({
 markerImg, markerHighlightImg, position, active, onClick, width = 0.08, height = 0.08, anchorX = 0.5, anchorY = 0.5 }) {
  const { simulation } = useStores();
  const [ hovered, setHovered ] = useState(false);
  const defTexture = useMemo(() => getTexture(markerImg), [markerImg]);
  const highlightTexture = useMemo(() => markerHighlightImg && getTexture(markerHighlightImg), [markerHighlightImg]);

  if (!simulation.dataReady) {
    // Don't render markers when simulation data isn't downloaded yet.
    return null;
  }

  const ratio = mToViewUnitRatio(simulation);
  const x = position.x * ratio + (0.5 - anchorX) * width;
  const y = position.y * ratio + (0.5 - anchorY) * height;
  const z = simulation.config.view3d ? mToViewElevationUnit(simulation, simulation.cellAt(position.x, position.y)?.elevation || 0) : 0;

  const texture = (hovered || active) && highlightTexture ? highlightTexture : defTexture;

  const eventHandlers = {
    onPointerOver: (e: PointerEvent) => {
      setHovered(true);
    },
    onPointerOut: (e: PointerEvent) => {
      setHovered(false);
    },
    onPointerUp: (e: PointerEvent) => {
      onClick?.();
    }
  };
  return (
    <mesh position={[x, y, z]} {...eventHandlers} renderOrder={1} >
      <planeGeometry attach="geometry" args={[width, height]}
      />
      <meshBasicMaterial attach="material" map={texture} depthTest={false} transparent={true} />
    </mesh>
  );
});
