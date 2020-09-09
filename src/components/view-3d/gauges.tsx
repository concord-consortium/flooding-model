import React from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { Marker } from "./marker";
import { getGaugeTabIndex } from "../side-container";

export const Gauges: React.FC = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();
  return <>
    {
      simulation.crossSections.map((csConfig, idx) => {
        const markerConfig = csConfig.marker;
        const position = {
          x: csConfig.riverGauge.x * simulation.config.modelWidth,
          y: csConfig.riverGauge.y * simulation.config.modelHeight
        };
        const onClick = () => {
          // Activate gauge side tab on marker click.
          ui.setTabIndex(getGaugeTabIndex(idx));
        };
        return <Marker
          key={idx}
          markerImg={markerConfig.img}
          markerHighlightImg={markerConfig.highlightImg}
          // Gauge icon is active when its gauge side tab is opened.
          active={ui.tabIndex === getGaugeTabIndex(idx)}
          position={position}
          anchorX={markerConfig.anchorX}
          anchorY={markerConfig.anchorY}
          width={(markerConfig.scale || 1) * 0.08}
          height={(markerConfig.scale || 1) * 0.08}
          onClick={onClick}
        />;
      })
    }
  </>;
});
