import React from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../../use-stores";
import { Marker } from "./marker";

export const Gauges: React.FC = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();
  const config = simulation.config;

  return <>
    {
      simulation.crossSections.map((csConfig, idx) => {
        const gaugeName = `gauge${idx + 1}` as "gauge1" | "gauge2" | "gauge3";
        const gaugeTabIdx = config.tabs.indexOf(gaugeName);
        if (gaugeTabIdx === -1) {
          return null;
        }
        const markerConfig = csConfig.marker;
        const position = {
          x: csConfig.riverGauge.x * simulation.config.modelWidth,
          y: csConfig.riverGauge.y * simulation.config.modelHeight
        };
        const onClick = () => {
          // Activate gauge side tab on marker click.
          ui.setTabIndex(gaugeTabIdx);
        };
        return <Marker
          key={idx}
          markerImg={markerConfig.img}
          markerHighlightImg={markerConfig.highlightImg}
          // Gauge icon is active when its gauge side tab is opened.
          active={ui.tabIndex === gaugeTabIdx}
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
