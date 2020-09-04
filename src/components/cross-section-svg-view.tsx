import React, { useEffect, useRef } from "react";
import { interpolate, InterpolateOptions } from "polymorph-js";
import CS1Background from "../assets/Model 2 Gauge 1 CS Landscape.svg";
import CS1Water from "../assets/Model 2 Gauge 1 CS Water.svg";
import CS2Background from "../assets/Model 2 Gauge 2 CS Landscape.svg";
import CS2Water from "../assets/Model 2 Gauge 2 CS Water.svg";
import CS3Background from "../assets/Model 2 Gauge 3 CS Landscape.svg";
import CS3Water from "../assets/Model 2 Gauge 3 CS Water.svg";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import css from "./cross-section-svg-view.scss";
import { SimulationModel } from "../models/simulation";

const CrossSectionBackground: {[key: number]: React.JSXElementConstructor<any>} = {
  0: CS1Background,
  1: CS2Background,
  2: CS3Background
};

const CrossSectionWater: {[key: number]: React.JSXElementConstructor<any>} = {
  0: CS1Water,
  1: CS2Water,
  2: CS3Water
};

// polymorph-js options
const interpolationOptions: InterpolateOptions = { precision: 3, optimize: "none" };

const pathTypes = [
  "left_water_line",
  "center_water_line",
  "right_water_line",
  "flood_left_water_line",
  "flood_right_water_line",
];

const riverStateSteps = [0, 0.35, 0.8, 1];
const riverStateValues = ["LOW", "MED", "HI", "CREST"];

const floodStateSteps = [0, 1];
const floodStateValues = ["CREST", "FLOOD4"];

const getPath = (type: string, stateName: string) => {
  return document.getElementById(`${type}_${stateName}`)?.getAttribute("d") || null;
};

const getStateDesc = (simulation: SimulationModel, gauge: number, segment: "left" | "center" | "right") => {
  const csConfig = simulation.config.crossSections[gauge];
  const crossSectionState = simulation.crossSectionState[gauge];
  let gaugeReading;
  if (segment === "left") {
    gaugeReading = crossSectionState.leftLandGaugeReading;
  } else if (segment === "center") {
    gaugeReading = crossSectionState.riverGaugeReading;
  } else {
    gaugeReading = crossSectionState.rightLandGaugeReading;
  }

  let normalizedGauge, stepArray, valueArray;
  // Separate paths for pre-flood and flood phases.
  if (gaugeReading === 0) {
    stepArray = riverStateSteps;
    valueArray = riverStateValues;
    normalizedGauge = (crossSectionState.riverDepth - csConfig.minRiverDepth) / (csConfig.maxRiverDepth - csConfig.minRiverDepth);
  } else {
    stepArray = floodStateSteps;
    valueArray = floodStateValues;
    // Left or right gauge is probably placed higher or lower than the river gauge. Calculate height difference
    // and add it to the result that is used to move the water level line.
    if (segment === "left") {
      const riverBaseElev = simulation.getCrossSectionCell(gauge, "riverGauge")?.baseElevation || 0;
      const leftGaugeElev = simulation.getCrossSectionCell(gauge, "leftLandGauge")?.baseElevation || 0;
      gaugeReading += leftGaugeElev - riverBaseElev;
    } else if (segment === "right") {
      const riverBaseElev = simulation.getCrossSectionCell(gauge, "riverGauge")?.baseElevation || 0;
      const rightGaugeElev = simulation.getCrossSectionCell(gauge, "rightLandGauge")?.baseElevation || 0;
      gaugeReading += rightGaugeElev - riverBaseElev;
    }
    normalizedGauge = gaugeReading / (csConfig.maxFloodDepth - csConfig.maxRiverDepth);
  }

  let startStateIdx = 0;
  while (normalizedGauge > stepArray[startStateIdx + 1]) {
    startStateIdx += 1;
  }

  const startState = valueArray[startStateIdx];
  const endState = valueArray[startStateIdx + 1] || valueArray[valueArray.length - 1];

  // stepProgress: value [0, 1] that defines interpolation level between startState and endState.
  const startReading = stepArray[startStateIdx];
  const endReading = stepArray[startStateIdx + 1] === undefined ? 1 : stepArray[startStateIdx + 1];
  const range = (endReading - startReading);
  const stepProgress = range > 0 ? (normalizedGauge - startReading) / range : 1;

  return { startState, endState, stepProgress };
};

const getLeveesClassName = (simulation: SimulationModel, gauge: number) => {
  const crossSectionState = simulation.crossSectionState[gauge];
  if (crossSectionState.leftLevee && crossSectionState.rightLevee) {
    return "twoL";
  } else if (crossSectionState.leftLevee) {
    return "leftL";
  } else if (crossSectionState.rightLevee) {
    return "rightL";
  } else {
    return "zeroL";
  }
};

interface IProps {
  gauge: number;
}

// Cross-section view is based on SVG images and only one simulation output - riverStage.
// SVG image is imported by webpack svgr loader and directly embedded into DOM source. That way it's possible to hide
// some of its element using CSS and make transformations using JS. CSS hides all the water level lines by default.
// JS code below uses polymorph-js to take water line (that consists of white line and dashed line) and transparent
// water layer and morph between various states using `riverStage` simulation output.
export const CrossSectionSVGView: React.FC<IProps> = observer(({ gauge}) => {
  const CrossSectionBgComp = CrossSectionBackground[gauge];
  const CrossSectionWaterComp = CrossSectionWater[gauge];
  const { simulation } = useStores();
  // SVG output paths.
  const pathOutputRefs = useRef(pathTypes.map(() => useRef<SVGPathElement | null>()));
  // SVG path interpolators used to morph one path into another.
  const interpolatorRefs = useRef(pathTypes.map(() => useRef<(offset: number) => string>()));

  const leftState = getStateDesc(simulation, gauge, "left");
  const centerState = getStateDesc(simulation, gauge, "center");
  const rightState = getStateDesc(simulation, gauge, "right");

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
      if (pathType.startsWith("flood_left")) {
        stepProgress = leftState.stepProgress;
      } else if (pathType.startsWith("flood_right")) {
        stepProgress = rightState.stepProgress;
      } else {
        stepProgress = centerState.stepProgress;
      }
      pathOutputRef.current?.setAttribute("d", interpolator?.(stepProgress) || "");
    });
  }, [centerState, leftState, rightState]);

  return (
    <div className={css.crossSection}>
      <div className={`${css.background} ${css[getLeveesClassName(simulation, gauge)]}`}>
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
