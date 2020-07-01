import { inject, observer } from "mobx-react";
import React from "react";
import { BaseComponent, IBaseProps } from "./base";
import CCLogo from "../assets/cc-logo.svg";
import CCLogoSmall from "../assets/cc-logo-small.svg";
import screenfull from "screenfull";
import Button from "@material-ui/core/Button";
import Slider from "@material-ui/core/Slider";
import PauseIcon from "../assets/bottom-bar/pause.svg";
import StartIcon from "../assets/bottom-bar/start.svg";
import ReloadIcon from "../assets/bottom-bar/reload.svg";
import RestartIcon from "../assets/bottom-bar/restart.svg";
import css from "./bottom-bar.scss";

interface IProps extends IBaseProps {}
interface IState {
  fullscreen: boolean;
}

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

@inject("stores")
@observer
export class BottomBar extends BaseComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      fullscreen: false
    };
  }

  get fullscreenIconStyle() {
    return css.fullscreenIcon + (this.state.fullscreen ? ` ${css.fullscreen}` : "");
  }

  public componentDidMount() {
    if (screenfull && screenfull.isEnabled) {
      document.addEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange);
    }
  }

  public componentWillUnmount() {
    if (screenfull && screenfull.isEnabled) {
      document.removeEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange);
    }
  }

  public render() {
    const { simulation } = this.stores;
    return (
      <div className={css.bottomBar}>
        <div className={css.leftContainer}>
          <CCLogo className={css.logo} />
          <CCLogoSmall className={css.logoSmall} />
        </div>
        <div className={css.mainContainer}>
          <div className={`${css.widgetGroup} ${css.reloadRestart}`}>
            <Button
              className={css.playbackButton}
              data-test="reload-button"
              onClick={this.handleReload}
              disableRipple={true}
            >
              <span><ReloadIcon/> Reload</span>
            </Button>
            <Button
              className={css.playbackButton}
              data-test="restart-button"
              onClick={this.handleRestart}
              disableRipple={true}
            >
              <span><RestartIcon/> Restart</span>
            </Button>
          </div>
          <div className={`${css.widgetGroup} ${css.startStop}`}>
            <Button
              onClick={this.handleStart}
              disabled={!simulation.ready}
              className={css.playbackButton}
              data-test="start-button"
              disableRipple={true}
            >
              { simulation.simulationRunning ? <span><PauseIcon/> Stop</span> : <span><StartIcon /> Start</span> }
            </Button>
          </div>
          <div className={`${css.widgetGroup}`}>
            <div className={css.water}>
              Water level
              <Slider
                value={simulation.waterLevel}
                min={simulation.minRiverElevation - 1}
                max={simulation.maxElevation}
                onChange={this.handleWaterLevelChange}
              />
            </div>
          </div>
        </div>
        {/* This empty container is necessary so the spacing works correctly */}
        <div className={css.rightContainer}>
          {
            screenfull && screenfull.isEnabled &&
            <div className={this.fullscreenIconStyle} onClick={toggleFullscreen} title="Toggle Fullscreen" />
          }
        </div>
      </div>
    );
  }

  public fullscreenChange = () => {
    this.setState({ fullscreen: screenfull.isEnabled && screenfull.isFullscreen });
  }

  public handleStart = () => {
    const { simulation } = this.stores;
    if (simulation.simulationRunning) {
      simulation.stop();
    } else {
      simulation.start();
    }
  }

  public handleRestart = () => {
    this.stores.simulation.restart();
  }

  public handleReload = () => {
    this.stores.simulation.reload();
  }

  public handleWaterLevelChange = (event: React.ChangeEvent, newValue: number) => {
    const { simulation } = this.stores;
    simulation.waterLevel = newValue;
  }
}
