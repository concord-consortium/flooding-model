import React, { useEffect, useRef } from "react";
import { interpolate } from "polymorph-js";
import CS1Background from "../assets/Model 2 Gauge 1 CS Landscape.svg";
import CS1Water from "../assets/Model 2 Gauge 1 CS Water.svg";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import css from "./cross-section-svg-view.scss";

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
  0: CS1Background
};

const CrossSectionWater: {[key: number]: React.JSXElementConstructor<any>} = {
  0: CS1Water
};

// These SVG paths don't work well, as they should be placed between layers of SVG background. In the current
// implementation, all the output paths are on top of the background.
// const riverLevel = "river_level";
// const riverLevelStyle = {fill: "#67A5D9"};
const waterLevel = "water_level";
const waterLevelStyle = {fill: "#67A5D9", opacity: 0.4};

const waterLine = "water_line";
const waterLineStyle = {fill: "none", stroke: "#2D95D2", strokeMiterlimit: 10};

const waterRightDottedLine = "water_right_dotted_line"; // only river states, flood states are just copied
const waterLeftDottedLine = "water_left_dotted_line"; // only river states, flood states are just copied
const waterDottedLineStyle = {opacity: 0.75, fill: "none", stroke: "#ffffff", strokeMiterlimit: 10, strokeDasharray: "4,8"};

const pathTypes = [
  // riverLevel,
  waterLevel,
  waterLine,
  waterRightDottedLine,
  waterLeftDottedLine
];

const pathStyles = [
  // riverLevelStyle,
  waterLevelStyle,
  waterLineStyle,
  waterDottedLineStyle,
  waterDottedLineStyle
];


const riverStateKeys = [0, 0.35, 0.8, 1];
const riverStateValues = ["LOW", "MED", "HI", "CREST"];

const floodStateKeys = [0, 0.25, 0.5, 0.75, 0.8125, 0.875, 0.9375, 1];
const floodStateValues = ["CREST", "FLOOD1", "FLOOD2", "FLOOD3", "FLOOD3A", "FLOOD3B", "FLOOD3C", "FLOOD4"];

const getStateIdx = (type: "river" | "flood", normalizedGauge: number) => {
  let idx = 0;
  const array = type === "river" ? riverStateKeys : floodStateKeys;
  while (normalizedGauge > array[idx + 1]) {
    idx += 1;
  }
  return idx;
};

const getPathSelector = (type: string, stateName: string, levees: Levees) => {
  let dataName = `${type}_${stateName}`; // e.g. river_level_CREST
  if (stateName.startsWith("FLOOD")) {
    dataName = `${levees}_${dataName}`;
  }
  return `path[data-name='${dataName}']`;
};

const getPath = (type: string, stateName: string, levees: Levees) => {
  const selector = getPathSelector(type, stateName, levees);
  return document.querySelector(selector)?.getAttribute("d") || "";
};

// Cross-section view is based on SVG images and only one simulation output - riverStage.
// SVG image is imported by webpack svgr loader and directly embedded into DOM source. That way it's possible to hide
// some of its element using CSS and make transformations using JS. CSS hides all the water level lines by default.
// JS code below uses polymorph-js to take water line (that consists of white line and dashed line) and transparent
// water layer and morph between various states using `riverStage` simulation output. Morphed path is rendered
// on top of the original SVG. All the necessary selectors are defined as constants above.
export const CrossSectionSVGView: React.FC<IProps> = observer(({ gauge, levees = Levees.Two }) => {
  const CrossSectionBgComp = CrossSectionBackground[gauge];
  const CrossSectionWaterComp = CrossSectionWater[gauge];
  const { simulation } = useStores();
  // SVG output paths.
  const pathOutputRefs = useRef(pathTypes.map(() => useRef<SVGPathElement>(null)));
  // SVG path interpolators used to morph one path into another.
  const interpolatorRefs = useRef(pathTypes.map(() => useRef<(offset: number) => string>()));

  const gaugeProps = simulation.config.gauges[gauge];
  const gaugeReading = simulation.gaugeReading[gauge] === undefined ? gaugeProps.minRiverDepth : simulation.gaugeReading[gauge];

  let startState: string, endState: string, stepProgress: number;
  if (gaugeReading < gaugeProps.maxRiverDepth) {
    const normalizedGauge = (gaugeReading - gaugeProps.minRiverDepth) / (gaugeProps.maxRiverDepth - gaugeProps.minRiverDepth);
    const startStateIdx = getStateIdx("river", normalizedGauge);
    startState = riverStateValues[startStateIdx];
    endState = riverStateValues[startStateIdx + 1] || riverStateValues[riverStateValues.length - 1];
    // Value [0, 1] that defines interpolation level between <pathName>[startState] and <pathName>[startState + 1].
    const startReading = riverStateKeys[startStateIdx];
    const endReading = riverStateKeys[startStateIdx + 1] === undefined ? 1 : riverStateKeys[startStateIdx + 1];
    const range = (endReading - startReading);
    stepProgress = range > 0 ? (normalizedGauge - startReading) / range : 1;
  } else {
    const normalizedGauge = (gaugeReading - gaugeProps.maxRiverDepth) / (gaugeProps.maxFloodDepth - gaugeProps.maxRiverDepth);
    const startStateIdx = getStateIdx("flood", normalizedGauge);
    startState = floodStateValues[startStateIdx];
    endState = floodStateValues[startStateIdx + 1] || floodStateValues[floodStateValues.length - 1];
    // Value [0, 1] that defines interpolation level between <pathName>[startState] and <pathName>[startState + 1].
    const startReading = floodStateKeys[startStateIdx];
    const endReading = floodStateKeys[startStateIdx + 1] === undefined ? 1 : floodStateKeys[startStateIdx + 1];
    const range = (endReading - startReading);
    stepProgress = range > 0 ? (normalizedGauge - startReading) / range : 1;
  }

  // Keep interpolator updates separate from interpolation itself for performance reasons.
  // Interpolators need to be updated only when path idx needs to change, while the final path is updated more often.
  useEffect(() => {
    interpolatorRefs.current.forEach((interpolatorRef, idx) => {
      interpolatorRef.current = interpolate(
        [getPath(pathTypes[idx], startState, levees), getPath(pathTypes[idx], endState, levees)],
        { precision: 3 }
      );
    });
  }, [levees, startState, endState]);


  useEffect(() => {
    pathOutputRefs.current.forEach((pathOutputRef, idx) => {
      const interpolator = interpolatorRefs.current[idx].current;
      // console.log("interpolation:", interpolator?.(stepProgress));
      pathOutputRef.current?.setAttribute("d", interpolator?.(stepProgress) || "");
    });
  }, [stepProgress]);

  return (
    <div className={css.crossSection}>
      <div className={css.background}>
        <CrossSectionBgComp />
      </div>
      <div className={css.svgPathSource}>
        <CrossSectionWaterComp />
      </div>
      <div className={css.svgPathOutput}>
        {/* Viewbox should match background SVG viewBox */}
        <svg viewBox="0 0 402 157">
          {/* Styles are taken from SVG */}
          {
            pathOutputRefs.current.map((pathOutputRef, idx) =>
              <path key={idx} ref={pathOutputRef} style={pathStyles[idx]} />
            )
          }
          {/*<path ref={waterWhiteLineRef} style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, opacity: 0.6 }}/>*/}
          {/*<path ref={waterLineRef} style={{ fill: "none", stroke: "#2D95D2", strokeMiterlimit: 10,  }}/>*/}
        </svg>
      </div>
    </div>
  );
});
