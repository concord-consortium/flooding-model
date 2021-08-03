import React from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import ZoomIn from "../assets/zoom-in.svg";
import ZoomOut from "../assets/zoom-out.svg";
import ResetCamera from "../assets/reset-camera.svg";
import { log } from "@concord-consortium/lara-interactive-api";
import css from "./nav-buttons.scss";

export const zoomDistDiff = 0.5;

export const NavButtons: React.FC = observer(() => {
  const { ui } = useStores();

  const handleZoomIn = () => {
    ui.setCameraDistance(ui.getCameraDistance() - zoomDistDiff);
    log("ZoomInClicked");
  };
  const handleZoomOut = () => {
    ui.setCameraDistance(ui.getCameraDistance() + zoomDistDiff);
    log("ZoomOutClicked");
  };
  const handleResetCamera = () => {
    ui.resetCameraPos();
    log("CameraResetClicked");
  };

  const zoomInDisabled = !ui.canZoomIn();
  const zoomOutDisabled = !ui.canZoomOut();
  const resetCameraDisabled = !ui.isCameraPosModified();

  return (
    <div className={css.navButtons}>
      <div className={css.btnGroup}>
        <div className={`${css.button} ${zoomInDisabled ? css.disabled : ""}`} onClick={handleZoomIn} data-test="zoom-in"><ZoomIn /></div>
        <div className={`${css.button} ${zoomOutDisabled ? css.disabled : ""}`} onClick={handleZoomOut} data-test="zoom-out"><ZoomOut /></div>
      </div>
      <div className={`${css.button} ${resetCameraDisabled ? css.disabled : ""}`} onClick={handleResetCamera} data-test="reset-camera">
        <ResetCamera />
      </div>
    </div>
  );
});
