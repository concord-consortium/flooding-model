import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { GaugeTab } from "./gauge-tab";
import { FloodAreaGraph } from "./flood-area-graph";
import { MapsTab } from "./maps-tab";
import Marker1 from "../assets/marker1.svg";
import Marker2 from "../assets/marker2.svg";
import Marker3 from "../assets/marker3.svg";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { Header } from "./header";

import "react-tabs/style/react-tabs.css";
import css from "./side-container.scss";

const tabBgColorCss = [
  css.mapsBackground,
  css.graphBackground,
  css.gauge1Background,
  css.gauge2Background,
  css.gauge3Background,
];

const gaugeBorderColorCss = [
  css.gauge1Border,
  css.gauge2Border,
  css.gauge3Border
];

const GaugeMarker = [Marker1, Marker2, Marker3];

// For now there are two tabs in front of the gauge tabs. This function is used by the gauge markers to get correct
// gauge tab index. When more tabs are added, this constant might need to be updated.
const PRE_GAUGES_TAB_COUNT = 2;
export const getGaugeTabIndex = (gaugeIndex: number) => {
  return PRE_GAUGES_TAB_COUNT + gaugeIndex;
};

export const SideContainer = observer(() => {
  const { simulation, ui } = useStores();
  const tabIndex = ui.tabIndex;
  const handleTabChange = (newTabIndex: number) => ui.setTabIndex(newTabIndex);
  const crossSections = simulation.crossSections;

  return (
    <Tabs className={`${css.tabs} ${tabBgColorCss[tabIndex]}`} selectedIndex={tabIndex} onSelect={handleTabChange}>
      <TabList className={`react-tabs__tab-list ${css.tabList}`}>
        <Tab className={`${css.tab} ${css.mapsBorder}`} selectedClassName={css.tabSelected}>
          <div className={css.tabInsideContainer}>Maps</div>
        </Tab>
        <Tab className={`${css.tab} ${css.graphBorder}`} selectedClassName={css.tabSelected}>
          <div className={css.tabInsideContainer}>Graph</div>
        </Tab>
        {
          crossSections.map((g, idx) => {
            const Icon = GaugeMarker[idx];
            return (
              <Tab key={idx} className={`${css.tab} ${gaugeBorderColorCss[idx]}`} selectedClassName={css.tabSelected}>
                <div className={css.tabInsideContainer}>Gauge <Icon/></div>
              </Tab>
            );
          })
        }
      </TabList>


      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.mapsBorder}`}>
        <MapsTab/>
      </TabPanel>
      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.graphBorder}`}>
        <FloodAreaGraph/>
      </TabPanel>
      {
        crossSections.map((g, idx) => {
          const Icon = GaugeMarker[idx];
          return (<TabPanel key={idx} className={`react-tabs__tab-panel ${css.tabPanel} ${gaugeBorderColorCss[idx]}`}>
              <Header><Icon className={css.icon}/> Stream Gauge {idx + 1}: Cross-section</Header>
              <GaugeTab gauge={idx}/>
            </TabPanel>
          );
        }
      )
      }
    </Tabs>
  );
});
