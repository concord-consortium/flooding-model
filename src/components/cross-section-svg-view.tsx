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
import { IGaugeConfig } from "../config";

enum Levees {
  Zero = "zeroL",
  Right = "rightL",
  Left = "leftL",
  Two = "twoL"
}

interface IProps {
  gauge: number;
  levees?: Levees;
}

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
  "river_level",
  "water_level",
  "water_line",
  "water_right_dotted_line",
  "water_left_dotted_line"
];

const riverStateSteps = [0, 0.35, 0.8, 1];
const riverStateValues = ["LOW", "MED", "HI", "CREST"];

const floodStateSteps = [0, 0.25, 0.5, 0.75, 1];
const floodStateValues = ["CREST", "FLOOD1", "FLOOD2", "FLOOD3", "FLOOD4"];

const getPathSelector = (type: string, stateName: string, levees: Levees) => {
  let dataName = `${type}_${stateName}`; // e.g. river_level_CREST
  if (stateName.startsWith("FLOOD")) {
    dataName = `${levees}_${dataName}`;
  }
  return `#${dataName}`;
};

const getStateDesc = (gaugeReading: number, gaugeProps: IGaugeConfig) => {
  let normalizedGauge, stepArray, valueArray;
  // Separate paths for pre-flood and flood phases.
  if (gaugeReading < gaugeProps.maxRiverDepth) {
    normalizedGauge = (gaugeReading - gaugeProps.minRiverDepth) / (gaugeProps.maxRiverDepth - gaugeProps.minRiverDepth);
    stepArray = riverStateSteps;
    valueArray = riverStateValues;
  } else {
    normalizedGauge = (gaugeReading - gaugeProps.maxRiverDepth) / (gaugeProps.maxFloodDepth - gaugeProps.maxRiverDepth);
    stepArray = floodStateSteps;
    valueArray = floodStateValues;
  }

  let startStateIdx = 0;
  while (normalizedGauge > stepArray[startStateIdx + 1]) {
    startStateIdx += 1;
  }

  const startState = valueArray[startStateIdx];
  const endState = valueArray[startStateIdx + 1] || valueArray[riverStateValues.length - 1];

  // stepProgress: value [0, 1] that defines interpolation level between startState and endState.
  const startReading = stepArray[startStateIdx];
  const endReading = stepArray[startStateIdx + 1] === undefined ? 1 : stepArray[startStateIdx + 1];
  const range = (endReading - startReading);
  const stepProgress = range > 0 ? (normalizedGauge - startReading) / range : 1;

  return { startState, endState, stepProgress };
};

// Cross-section view is based on SVG images and only one simulation output - riverStage.
// SVG image is imported by webpack svgr loader and directly embedded into DOM source. That way it's possible to hide
// some of its element using CSS and make transformations using JS. CSS hides all the water level lines by default.
// JS code below uses polymorph-js to take water line (that consists of white line and dashed line) and transparent
// water layer and morph between various states using `riverStage` simulation output.
export const CrossSectionSVGView: React.FC<IProps> = observer(({ gauge, levees = Levees.Zero }) => {
  const CrossSectionBgComp = CrossSectionBackground[gauge];
  const CrossSectionWaterComp = CrossSectionWater[gauge];
  const { simulation } = useStores();
  // SVG output paths.
  const pathOutputRefs = useRef(pathTypes.map(() => useRef<SVGPathElement | null>()));
  // SVG path interpolators used to morph one path into another.
  const interpolatorRefs = useRef(pathTypes.map(() => useRef<(offset: number) => string>()));

  const gaugeProps = simulation.config.gauges[gauge];
  const gaugeReading = simulation.gaugeReading[gauge] === undefined ? gaugeProps.minRiverDepth : simulation.gaugeReading[gauge];

  const { startState, endState, stepProgress } = getStateDesc(gaugeReading, gaugeProps);

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
      interpolatorRef.current = interpolate(
        [getPathSelector(pathTypes[idx], startState, levees), getPathSelector(pathTypes[idx], endState, levees)],
        interpolationOptions
      );
    });
  }, [levees, startState, endState]);


  useEffect(() => {
    pathOutputRefs.current.forEach((pathOutputRef, idx) => {
      const interpolator = interpolatorRefs.current[idx].current;
      pathOutputRef.current?.setAttribute("d", interpolator?.(stepProgress) || "");
    });
  }, [stepProgress]);

  return (
    <div className={css.crossSection}>
      <div className={`${css.background} ${css[levees]}`}>
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
