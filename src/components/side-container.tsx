import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { CrossSectionTab } from "./cross-section-tab";
import Marker1 from "../assets/marker1.svg";
import Marker2 from "../assets/marker2.svg";
import Marker3 from "../assets/marker3.svg";
import "react-tabs/style/react-tabs.css";
import css from "./side-container.scss";

const tabBgColorCss = [
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

      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.gauge1Border}`}>
        <CrossSectionTab gauge={1} />
      </TabPanel>
      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.gauge2Border}`}>
        <CrossSectionTab gauge={2} />
      </TabPanel>
      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.gauge3Border}`}>
        <CrossSectionTab gauge={3} />
      </TabPanel>
    </Tabs>
  );
};
