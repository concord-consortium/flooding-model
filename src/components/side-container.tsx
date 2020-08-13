import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { CrossSection } from "./cross-section";
import { FloodAreaGraph } from "./flood-area-graph";
import Marker1 from "../assets/marker1.svg";
import Marker2 from "../assets/marker2.svg";
import Marker3 from "../assets/marker3.svg";

import "react-tabs/style/react-tabs.css";
import css from "./side-container.scss";

const tabBgColorCss = [
  css.graphBackground,
  css.gauge1Background,
  css.gauge2Background,
  css.gauge3Background,
];

export const SideContainer = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (newTabIndex: number) => setTabIndex(newTabIndex);

  return (
    <Tabs className={`${css.tabs} ${tabBgColorCss[tabIndex]}`} selectedIndex={tabIndex} onSelect={handleTabChange}>
      <TabList className={`react-tabs__tab-list ${css.tabList}`}>
        <Tab className={`${css.tab} ${css.graphBorder}`} selectedClassName={css.tabSelected}>
          <div className={css.tabInsideContainer}>Graph</div>
        </Tab>
        <Tab className={`${css.tab} ${css.gauge1Border}`} selectedClassName={css.tabSelected}>
          <div className={css.tabInsideContainer}>Gauge <Marker1/></div>
        </Tab>
        <Tab className={`${css.tab} ${css.gauge2Border}`} selectedClassName={css.tabSelected}>
          <div className={css.tabInsideContainer}>Gauge <Marker2/></div>
        </Tab>
        <Tab className={`${css.tab} ${css.gauge3Border}`} selectedClassName={css.tabSelected}>
          <div className={css.tabInsideContainer}>Gauge <Marker3/></div>
        </Tab>
      </TabList>

      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.graphBorder}`}>
        <div className={css.header}>Graph: Total Flood Area vs. Time</div>
        <FloodAreaGraph />
      </TabPanel>
      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.gauge1Border}`}>
        <div className={css.header}><Marker1 className={css.icon}/> Steam Gauge 1: Cross-section</div>
        <CrossSection gauge={1} />
      </TabPanel>
      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.gauge2Border}`}>
        <div className={css.header}><Marker2 className={css.icon}/> Steam Gauge 2: Cross-section</div>
        <CrossSection gauge={2} />
      </TabPanel>
      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.gauge3Border}`}>
        <div className={css.header}><Marker3 className={css.icon}/> Steam Gauge 3: Cross-section</div>
        <CrossSection gauge={3} />
      </TabPanel>
    </Tabs>
  );
};
