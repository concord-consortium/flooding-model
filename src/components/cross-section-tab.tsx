import React, { useEffect, useRef } from "react";
import { interpolate } from "polymorph-js";
import Marker1 from "../assets/marker1.svg";
import Marker2 from "../assets/marker2.svg";
import Marker3 from "../assets/marker3.svg";
import CSView1 from "../assets/model2_gauge1_cross-section.svg";
import CSView2 from "../assets/model2_gauge2_cross-section.svg";
import CSView3 from "../assets/model2_gauge3_cross-section.svg";
import css from "./cross-section-tab.scss";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { RiverStage } from "../models/simulation";

interface IProps {
  gauge: 1 | 2 | 3;
}

const Icon: {[key: number]: React.JSXElementConstructor<any>} = {
  1: Marker1,
  2: Marker2,
  3: Marker3
};

const CrossSectionBackground: {[key: number]: React.JSXElementConstructor<any>} = {
  1: CSView1,
  2: CSView2,
  3: CSView3
};

// Semi-transparent water layer.
const waterLevel = [
  "path[data-name='water front - LOW']",
  "path[data-name='water front - MED']",
  "path[data-name='water front - HI']",
  "path[data-name='water front - CREST']",
];

// White water line.
const waterWhiteLine = [
  "path[data-name='water white line - LOW']",
  "path[data-name='water white line - MED']",
  "path[data-name='water white line - HI']",
  "path[data-name='water white line - CREST']",
];

// Dashed water line.
const waterLine = [
  "path[data-name='water line - LOW']",
  "path[data-name='water line - MED']",
  "path[data-name='water line - HI']",
  "path[data-name='water line - CREST']",
];

const imagesCount = waterLine.length;

// Cross-section view is based on SVG images and only one simulation output - riverStage.
// SVG image is imported by webpack svgr loader and directly embedded into DOM source. That way it's possible to hide
// some of its element using CSS and make transformations using JS. CSS hides all the water level lines by default.
// JS code below uses polymorph-js to take water line (that consists of white line and dashed line) and transparent
// water layer and morph between various states using `riverStage` simulation output. Morphed path is rendered
// on top of the original SVG. All the necessary selectors are defined as constants above.
export const CrossSectionTab: React.FC<IProps> = observer(({ gauge }) => {
  const IconComp = Icon[gauge];
  const CrossSectionBgComp = CrossSectionBackground[gauge];

  const { simulation } = useStores();
  // SVG output paths.
  const waterLevelRef = useRef<SVGPathElement>(null);
  const waterWhiteLineRef = useRef<SVGPathElement>(null);
  const waterLineRef = useRef<SVGPathElement>(null);
  // SVG path interpolators used to morph one path into another.
  const waterLineInterpolator = useRef<(offset: number) => string>();
  const waterWhiteLineInterpolator = useRef<(offset: number) => string>();
  const waterLevelInterpolator = useRef<(offset: number) => string>();

  const riverStage = simulation.riverStage;
  // Get path between path defined by startImgIdx and startImgIdx + 1.
  const startImgIdx = Math.max(0, Math.floor(((riverStage - RiverStage.Low) / RiverStage.Crest) * imagesCount));

  // Keep interpolator updates separate from interpolation itself for performance reasons.
  // Interpolators need to be updated only when path idx needs to change, while the final path is updated more often.
  useEffect(() => {
    const endImageIdx = Math.min(imagesCount - 1, startImgIdx + 1);
    waterLineInterpolator.current = interpolate([waterLine[startImgIdx], waterLine[endImageIdx]]);
    waterWhiteLineInterpolator.current = interpolate([waterWhiteLine[startImgIdx], waterWhiteLine[endImageIdx]]);
    waterLevelInterpolator.current = interpolate([waterLevel[startImgIdx], waterLevel[endImageIdx]]);
  }, [startImgIdx]);

  useEffect(() => {
    // Interpolation between LOW -> MED, MED -> HIGH, or HIGH -> CREST will take the same amount of time.
    const stepSize = (RiverStage.Crest - RiverStage.Low) / (imagesCount - 1);
    // Value [0, 1] that defines interpolation level between <pathName>[startImgIdx] and <pathName>[startImgIdx + 1].
    const stepProgress = (riverStage % stepSize) / stepSize;

    waterLineRef.current?.setAttribute("d", waterLineInterpolator.current?.(stepProgress) || "");
    waterWhiteLineRef.current?.setAttribute("d", waterWhiteLineInterpolator.current?.(stepProgress) || "");
    waterLevelRef.current?.setAttribute("d", waterLevelInterpolator.current?.(stepProgress) || "");
  }, [riverStage]);

  return (
    <div className={css.crossSection}>
      <div className={css.header}>
        <IconComp className={css.icon}/> Steam Gauge { gauge }: Cross-section
      </div>
      <div className={css.svgView}>
        <div className={css.background}>
          <CrossSectionBgComp />
        </div>
        <div className={css.waterLine}>
          {/* Viewbox should match background SVG viewBox */}
          <svg viewBox="0 0 402 157">
            {/* Styles are taken from background SVG */}
            <path ref={waterLevelRef} style={{ fill: "#50acff", opacity: 0.4 }}/>
            <path ref={waterWhiteLineRef} style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, opacity: 0.6 }}/>
            <path ref={waterLineRef} style={{ fill: "none", stroke: "#1b96db", strokeMiterlimit: 10, strokeDasharray: "8,4" }}/>
          </svg>
        </div>
      </div>
    </div>
  );
});
