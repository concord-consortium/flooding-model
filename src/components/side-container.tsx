import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
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
          <div className={css.tabInsideContainer}>Gauge 1</div>
        </Tab>
        <Tab className={`${css.tab} ${css.gauge2Border}`} selectedClassName={css.tabSelected}>
          <div className={css.tabInsideContainer}>Gauge 3</div>
        </Tab>
        <Tab className={`${css.tab} ${css.gauge3Border}`} selectedClassName={css.tabSelected}>
          <div className={css.tabInsideContainer}>Gauge 3</div>
        </Tab>
      </TabList>

      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.gauge1Border}`}>
      </TabPanel>
      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.gauge2Border}`}>
      </TabPanel>
      <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.gauge3Border}`}>
      </TabPanel>
    </Tabs>
  );
};
