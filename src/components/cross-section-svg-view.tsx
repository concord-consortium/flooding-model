import React, { useEffect, useRef } from "react";
import { interpolate, InterpolateOptions } from "polymorph-js";
import CS1BackgroundPresent from "../assets/Present Map Gauge 1 CS Landscape.svg";
import CS2BackgroundPresent from "../assets/Present Map Gauge 2 CS Landscape.svg";
import CS3BackgroundPresent from "../assets/Present Map Gauge 3 CS Landscape.svg";
import CS1BackgroundFuture from "../assets/Future Map Gauge 1 CS Landscape.svg";
import CS2BackgroundFuture from "../assets/Future Map Gauge 2 CS Landscape.svg";
import CS3BackgroundFuture from "../assets/Future Map Gauge 3 CS Landscape.svg";
import CS1BackgroundPast from "../assets/Past Map Gauge 1 CS Landscape.svg";
import CS2BackgroundPast from "../assets/Past Map Gauge 2 CS Landscape.svg";
import CS3BackgroundPast from "../assets/Past Map Gauge 3 CS Landscape.svg";
import CS1Water from "../assets/Gauge 1 CS Water.svg";
import CS2Water from "../assets/Gauge 2 CS Water.svg";
import CS3Water from "../assets/Gauge 3 CS Water.svg";
import CS1Indicator from "../assets/marker1 CS stream gauge indicator.png";
import CS2Indicator from "../assets/marker2 CS stream gauge indicator.png";
import CS3Indicator from "../assets/marker3 CS stream gauge indicator.png";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { ICrossSectionState } from "../models/simulation";
import { ICrossSectionConfig, MainPresetType } from "../config";
import { Header } from "./header";

import css from "./cross-section-svg-view.scss";

const CrossSectionBackground: Record <MainPresetType, Record <number, React.JSXElementConstructor<any>>> = {
  present: {
    0: CS1BackgroundPresent,
    1: CS2BackgroundPresent,
    2: CS3BackgroundPresent
  },
  future: {
    0: CS1BackgroundFuture,
    1: CS2BackgroundFuture,
    2: CS3BackgroundFuture
  },
  past: {
    0: CS1BackgroundPast,
    1: CS2BackgroundPast,
    2: CS3BackgroundPast
  }
};

const CrossSectionWater: {[key: number]: React.JSXElementConstructor<any>} = {
  0: CS1Water,
  1: CS2Water,
  2: CS3Water
};

const CrossSectionIndicatorSrc: { [key: number]: string } = {
  0: CS1Indicator,
  1: CS2Indicator,
  2: CS3Indicator
};

// polymorph-js options
const interpolationOptions: InterpolateOptions = { precision: 3, optimize: "none" };

const pathTypes = [
  "left_water_line",
  "center_water_line",
  "right_water_line",
  "flood_left_water_line",
  "flood_right_water_line",
  "left_water_level",
  "center_water_level",
  "right_water_level",
  "flood_left_water_level",
  "flood_right_water_level",
];

const getPath = (type: string, stateName: string) => {
  return document.getElementById(`${type}_${stateName}`)?.getAttribute("d") || null;
};

// [0, 1] - before flood, only water table line being changed. [1-2] - flood, water line above earth surface.
const progressSteps = [0, 0.35, 0.8, 1, 2];
const progressValues = ["LOW", "MED", "HI", "CREST", "FLOOD4"];

const getSegmentProgress = (csState: ICrossSectionState, csConfig: ICrossSectionConfig, segment: "left" | "center" | "right") => {
  const { centerCell, leftCell, rightCell } = csState;
  let cell;
  if (segment === "left") {
    cell = leftCell;
  } else if (segment === "right") {
    cell = rightCell;
  } else {
    cell = centerCell;
  }
  const waterSaturation = cell.waterSaturation; // [0, 1]
  let waterDepth = cell.waterDepth; // [0, ?]

  if (segment === "left" && waterDepth > 0) {
    // Flood. Add elevation difference.
    const riverBaseElev = centerCell.baseElevation || 0;
    const leftGaugeElev = leftCell.baseElevation || 0;
    // Land is always higher than river in all our cross-section, but heightmap might not be precise.
    // Ensure that this value is > 0.
    waterDepth += Math.max(0, leftGaugeElev - riverBaseElev);
  } else if (segment === "right" && waterDepth > 0) {
    const riverBaseElev = centerCell.baseElevation || 0;
    const rightGaugeElev = rightCell.baseElevation || 0;
    // Land is always higher than river in all our cross-section, but heightmap might not be precise.
    // Ensure that this value is > 0.
    waterDepth += Math.max(0, rightGaugeElev - riverBaseElev);
  }

  const normalizedWaterDepth = waterDepth / (csConfig.maxFloodDepth - csConfig.maxRiverDepth); // [0, 1]
  const totalProgress = waterSaturation + normalizedWaterDepth; // value between [0, 2]

  let startStateIdx = 0;
  while (totalProgress > progressSteps[startStateIdx + 1]) {
    startStateIdx += 1;
  }

  const startState = progressValues[startStateIdx];
  const endState = progressValues[startStateIdx + 1] || progressValues[progressValues.length - 1];

  // stepProgress: value [0, 1] that defines interpolation level between startState and endState.
  const startStep = progressSteps[startStateIdx];
  const endStep = progressSteps[startStateIdx + 1] === undefined ? 1 : progressSteps[startStateIdx + 1];
  const range = (endStep - startStep);
  const stepProgress = range > 0 ? (totalProgress - startStep) / range : 1;

  return { startState, endState, stepProgress };
};

const getLeveesClassName = (csState: ICrossSectionState) => {
  const { leftLeveeCell, rightLeveeCell } = csState;
  if (leftLeveeCell.isLevee && rightLeveeCell.isLevee) {
    return "twoL";
  } else if (leftLeveeCell.isLevee) {
    return "leftL";
  } else if (rightLeveeCell.isLevee) {
    return "rightL";
  } else {
    return "zeroL";
  }
};

interface IProps {
  gauge: number;
}

// SVG image is imported by webpack svgr loader and directly embedded into DOM source. That way it's possible to hide
// some of its element using CSS and make transformations using JS. CSS hides all the water level lines by default.
// JS code below uses polymorph-js to take water line (that consists of white line and dashed line) and transparent
// water layer and morph between various states using various simulation outputs.
export const CrossSectionSVGView: React.FC<IProps> = observer(({ gauge}) => {
  const { simulation } = useStores();
  const bgType = simulation.config.crossSections[gauge].backgroundType;
  const CrossSectionBgComp = CrossSectionBackground[bgType][gauge];
  const CrossSectionGaugeIndicatorSrc = CrossSectionIndicatorSrc[gauge];
  const CrossSectionWaterComp = CrossSectionWater[gauge];

  // SVG output paths.
  const pathOutputRefs = useRef(pathTypes.map(() => useRef<SVGPathElement | null>()));
  // SVG path interpolators used to morph one path into another.
  const interpolatorRefs = useRef(pathTypes.map(() => useRef<(offset: number) => string>()));

  const csConfig = simulation.crossSections[gauge];
  const csState = simulation.crossSectionState[gauge];

  const leftState = getSegmentProgress(csState, csConfig, "left");
  const centerState = getSegmentProgress(csState, csConfig, "center");
  const rightState = getSegmentProgress(csState, csConfig, "right");

  useEffect(() => {
    pathOutputRefs.current.forEach((pathOutputRef, idx) => {
      // Empty output paths are defined in the landscape/background SVGs.
      pathOutputRef.current = document.getElementById(pathTypes[idx]) as SVGPathElement | null;
    });
  }, []);

  // Keep interpolator updates separate from interpolation itself for performance reasons.
  // Interpolators need to be updated only when path idx needs to change, while the final path is updated more often.
  useEffect(() => {
    interpolatorRefs.current.forEach((interpolatorRef, idx) => {
      const dummyInterpolator = () => "";
      const pathType = pathTypes[idx];
      let startState, endState;
      if (pathType.indexOf("left") !== -1) {
        startState = leftState.startState;
        endState = leftState.endState;
      } else if (pathType.indexOf("right") !== -1) {
        startState = rightState.startState;
        endState = rightState.endState;
      } else {
        startState = centerState.startState;
        endState = centerState.endState;
      }
      const path1 = getPath(pathTypes[idx], startState);
      const path2 = getPath(pathTypes[idx], endState);
      if (path1 && path2) {
        interpolatorRef.current = interpolate([path1, path2], interpolationOptions);
      } else {
        interpolatorRef.current = dummyInterpolator;
      }
    });
  }, [leftState, centerState, rightState]);

  useEffect(() => {
    pathOutputRefs.current.forEach((pathOutputRef, idx) => {
      const interpolator = interpolatorRefs.current[idx].current;
      const pathType = pathTypes[idx];
      let stepProgress;
      if (pathType.indexOf("left") !== -1) {
        stepProgress = leftState.stepProgress;
      } else if (pathType.indexOf("right") !== -1) {
        stepProgress = rightState.stepProgress;
      } else {
        stepProgress = centerState.stepProgress;
      }
      pathOutputRef.current?.setAttribute("d", interpolator?.(stepProgress) || "");
    });
  }, [centerState, leftState, rightState]);

  return (
    <div className={css.crossSection}>
      <div className={css.gaugeIndicator}>
        <div className={css.header}><Header>Stream Gauge {gauge + 1}: Cross-section</Header></div>
        <img src={CrossSectionGaugeIndicatorSrc} />
      </div>
      <div className={`${css.background} ${css[getLeveesClassName(csState)]}`}>
        {/* Note that background has layers of output paths where interpolated paths are injected */}
        <CrossSectionBgComp />
      </div>
      <div className={css.svgPathSource}>
        {/* Hidden, just a source of SVG paths that are interpolated by the code above */}
        <CrossSectionWaterComp />
      </div>
    </div>
  );
});
