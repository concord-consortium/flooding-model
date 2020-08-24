import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { GaugeTab } from "./gauge-tab";
import { FloodAreaGraph } from "./flood-area-graph";
import Marker1 from "../assets/marker1.svg";
import Marker2 from "../assets/marker2.svg";
import Marker3 from "../assets/marker3.svg";

import "react-tabs/style/react-tabs.css";
import css from "./side-container.scss";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { Header } from "./header";

const tabBgColorCss = [
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

export const SideContainer = observer(() => {
  const { simulation } = useStores();
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (newTabIndex: number) => setTabIndex(newTabIndex);
  const gauges = simulation.gauges;

  return (
    <Tabs className={`${css.tabs} ${tabBgColorCss[tabIndex]}`} selectedIndex={tabIndex} onSelect={handleTabChange}>
      <TabList className={`react-tabs__tab-list ${css.tabList}`}>
        <Tab className={`${css.tab} ${css.graphBorder}`} selectedClassName={css.tabSelected}>
          <div className={css.tabInsideContainer}>Graph</div>
        </Tab>
        {
          gauges.map((g, idx) => {
            const Icon = GaugeMarker[idx];
            return (
              <Tab key={idx} className={`${css.tab} ${gaugeBorderColorCss[idx]}`} selectedClassName={css.tabSelected}>
                <div className={css.tabInsideContainer}>Gauge <Icon/></div>
              </Tab>
            );
          })
        }
      </TabList>


      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.graphBorder}`}>
        <FloodAreaGraph/>
      </TabPanel>
      {
        gauges.map((g, idx) => {
          const Icon = GaugeMarker[idx];
          return (<TabPanel key={idx} className={`react-tabs__tab-panel ${css.tabPanel} ${gaugeBorderColorCss[idx]}`}>
              <Header><Icon className={css.icon}/> Steam Gauge {idx + 1}: Cross-section</Header>
              <GaugeTab gauge={idx}/>
            </TabPanel>
          );
        }
      )
      }
    </Tabs>
  );
});
