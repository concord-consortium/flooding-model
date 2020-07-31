import React, { useEffect, useRef } from "react";
import { interpolate } from "polymorph-js";
// import { interpolatePath } from "d3-interpolate-path";
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
  gauge: number;
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

const waterLevel = [
  "path[data-name='water front - LOW']",
  "path[data-name='water front - MED']",
  "path[data-name='water front - HI']",
  "path[data-name='water front - CREST']",
];

const waterWhiteLine = [
  "path[data-name='water white line - LOW']",
  "path[data-name='water white line - MED']",
  "path[data-name='water white line - HI']",
  "path[data-name='water white line - CREST']",
];

const waterLine = [
  "path[data-name='water line - LOW']",
  "path[data-name='water line - MED']",
  "path[data-name='water line - HI']",
  "path[data-name='water line - CREST']",
];

const imagesCount = waterLine.length;

export const CrossSectionTab: React.FC<IProps> = observer(({ gauge }) => {
  const IconComp = Icon[gauge];
  const CrossSectionBgComp = CrossSectionBackground[gauge];

  const { simulation } = useStores();
  const waterLevelRef = useRef<SVGPathElement>(null);
  const waterWhiteLineRef = useRef<SVGPathElement>(null);
  const waterLineRef = useRef<SVGPathElement>(null);

  const riverStage = simulation.riverStage;
  const startImgIdx = Math.max(0, Math.floor(((riverStage - RiverStage.Low) / RiverStage.Crest) * imagesCount));
  const stepSize = (RiverStage.Crest - RiverStage.Low) / (imagesCount - 1);
  const stepProgress = (riverStage % stepSize) / stepSize;

  useEffect(() => {
    const endImageIdx = Math.min(imagesCount - 1, startImgIdx + 1);

    const waterLineInterpolator = interpolate([
      document.querySelector(waterLine[startImgIdx])?.getAttribute("d") || "",
      document.querySelector(waterLine[endImageIdx])?.getAttribute("d") || ""
    ]);
    waterLineRef.current?.setAttribute("d", waterLineInterpolator(stepProgress));

    const waterWhiteLineInterpolator = interpolate([waterWhiteLine[startImgIdx], waterWhiteLine[endImageIdx]]);
    waterWhiteLineRef.current?.setAttribute("d", waterWhiteLineInterpolator(stepProgress));

    const waterLevelInterpolator = interpolate([waterLevel[startImgIdx], waterLevel[endImageIdx]]);
    waterLevelRef.current?.setAttribute("d", waterLevelInterpolator(stepProgress));
  }, [startImgIdx, stepProgress]);

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
          <svg viewBox="0 0 402 157">
            <path ref={waterLevelRef} style={{ fill: "#50acff", opacity: 0.4 }}/>
            <path ref={waterWhiteLineRef} style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, opacity: 0.6 }}/>
            <path ref={waterLineRef} style={{ fill: "none", stroke: "#1b96db", strokeMiterlimit: 10, strokeDasharray: "8,4" }}/>
          </svg>
        </div>
      </div>
    </div>
  );
});
