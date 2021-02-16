import React, { useEffect, useState } from "react";
import CCLogo from "./assets/cc-logo.svg";
import CCLogoSmall from "./assets/cc-logo-small.svg";
import screenfull from "screenfull";
import css from "./bottom-bar-container.scss";

const toggleFullscreen = () => {
  if (!screenfull || !screenfull.isEnabled) {
    return;
  }
  if (!screenfull.isFullscreen) {
    screenfull.request();
  } else {
    screenfull.exit();
  }
};

interface BottomBarContainerProps {
  children?: React.ReactNode;
}

export const BottomBarContainer: React.FC<BottomBarContainerProps> = ({ children }) => {
  const [ fullscreen, setFullscreen ] = useState<boolean>(false);

  useEffect(() => {
    if (screenfull && screenfull.isEnabled) {
      const eventName = screenfull.raw.fullscreenchange;
      document.addEventListener(eventName, fullscreenChange);
      return () => {
        document.removeEventListener(eventName, fullscreenChange);
      };
    }
  }, []);

  const fullscreenIconStyle = () => {
    return css.fullscreenIcon + (fullscreen ? ` ${css.fullscreen}` : "");
  };

  const fullscreenChange = () => {
    setFullscreen(screenfull.isEnabled && screenfull.isFullscreen);
  };

  return (
    <div className={css.bottomBar}>
      <div className={css.leftContainer}>
        <CCLogo className={css.logo} />
        <CCLogoSmall className={css.logoSmall} />
      </div>
      <div className={css.mainContainer}>
        { children }
      </div>
      {/* This empty container is necessary so the spacing works correctly */}
      <div className={css.rightContainer}>
        {
          screenfull && screenfull.isEnabled &&
          <div className={fullscreenIconStyle()} onClick={toggleFullscreen} title="Toggle Fullscreen" />
        }
      </div>
    </div>
  );
};

interface BottomBarWidgetGroupProps {
  children?: React.ReactNode;
  title?: string | string[];
  className?: string;
  hoverable?: boolean;
}
// This component is meat to be used as direct children of BottomBar.
export const BottomBarWidgetGroup: React.FC<BottomBarWidgetGroupProps> = ({ children, hoverable, title, className }) => {
  const titleLines = typeof title === "string" ? [ title ] : title;
  return (
    <div className={css.widgetGroup + (className ? ` ${className}` : "") + (hoverable ? " hoverable" : "")}>
      {
        titleLines &&
        <div className={css.title}>
          { titleLines.map(line => <div key={line}>{ line }</div>) }
        </div>
      }
      { children }
    </div>
  );
};
