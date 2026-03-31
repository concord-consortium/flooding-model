import React, { useEffect } from "react";
import { clsx } from "clsx";
import { observer } from "mobx-react";
import { View3d } from "./view-3d/view-3d";
import { BottomBar } from "./bottom-bar";
import Shutterbug from "shutterbug";
import { useCustomCursor } from "./use-custom-cursors";
import { TimeDisplay } from "./time-display";
import { NavButtons } from "./nav-buttons";
import { SideContainer } from "./side-container";
import { useStores } from "../use-stores";
import { TopBar } from "../geohazard-components/top-bar/top-bar";
import { AboutDialogContent } from "./about-dialog-content";
import { ShareDialogContent } from "./share-dialog-content";
import { LogMonitor } from "@concord-consortium/log-monitor";
import { log } from "../log";
import css from "./app.scss";

const getMousePosition = (e: React.MouseEvent) => {
  const rect = e.currentTarget.getBoundingClientRect();
  return {
    clientX: e.clientX,
    clientY: e.clientY,
    percentX: Math.round(((e.clientX - rect.left) / rect.width) * 100),
    percentY: Math.round(((e.clientY - rect.top) / rect.height) * 100)
  };
};

export const AppComponent = observer(function WrappedComponent() {
  const { simulation, simulation: { config }} = useStores();

  useEffect(() => {
    Shutterbug.enable("." + css.app);
    return () => {
      Shutterbug.disable();
    };
  }, []);

  // This will setup document cursor based on various states of UI store (interactions).
  useCustomCursor();

  const handleBeforeReload = () => {
    simulation.fireSimulationEnded("TopBarReloadButtonClicked");
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    log("SimulationMouseEnter", getMousePosition(e));
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    log("SimulationMouseLeave", getMousePosition(e));
  };

  const content = (
    <div
      className={css.app}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TopBar
        projectName="Flood Explorer"
        aboutContent={<AboutDialogContent />}
        shareContent={<ShareDialogContent />}
        onBeforeReload={handleBeforeReload}
      />
      <div className={`${css.mainContent}`}>
        <div className={`${css.topView}`}>
          <View3d />
          <div className={clsx(css.loadingMessage, { [css.active]: !simulation.dataReady })}>
            <div className={css.message}>Loading...</div>
          </div>
        </div>
        {
          config.tabs.length > 0 &&
          <div className={`${css.sideContainer}`}>
            <SideContainer />
          </div>
        }
      </div>
      <div className={`${css.bottomBar}`}>
        <BottomBar />
      </div>
      <div className={`${css.topLeftControls}`}>
        <TimeDisplay />
        <NavButtons />
      </div>
    </div>
  );

  return (
    <div
      style={config.logMonitor ? { display: "flex", width: "100%", height: "100%" } : { width: "100%", height: "100%" }}
    >
      {config.logMonitor
        ? <div style={{ flex: 1, overflow: "hidden", position: "relative", transform: "scale(1)" }}>{content}</div>
        : content
      }
      {config.logMonitor && <LogMonitor logFilePrefix="flooding-log-events" />}
    </div>
  );
});
