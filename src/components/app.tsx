import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { View3d } from "./view-3d/view-3d";
import { BottomBar } from "./bottom-bar";
import Shutterbug from "shutterbug";
import { useCustomCursor } from "./use-custom-cursors";
import { TimeDisplay } from "./time-display";
import { NavButtons } from "./nav-buttons";
import { SideContainer } from "./side-container";
import { useStores } from "../use-stores";
import css from "./app.scss";

export const AppComponent = observer(function WrappedComponent() {
  const { simulation: { config }} = useStores();

  useEffect(() => {
    Shutterbug.enable("." + css.app);
    return () => {
      Shutterbug.disable();
    };
  }, []);

  // This will setup document cursor based on various states of UI store (interactions).
  useCustomCursor();

  return (
    <div className={css.app}>
      <div className={`${css.mainContent}`}>
        <div className={`${css.topView}`}>
          <View3d />
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
});
