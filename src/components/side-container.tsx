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
import { log } from "@concord-consortium/lara-interactive-api";

import "react-tabs/style/react-tabs.css";
import css from "./side-container.scss";

const tabBgColorCss = {
  maps: css.mapsBackground,
  graph: css.graphBackground,
  gauge1: css.gauge1Background,
  gauge2: css.gauge2Background,
  gauge3: css.gauge3Background,
};

const gaugeBorderColorCss = [
  css.gauge1Border,
  css.gauge2Border,
  css.gauge3Border
];

const GaugeMarker = [Marker1, Marker2, Marker3];

export const SideContainer = observer(() => {
  const { simulation, ui } = useStores();
  const tabs = simulation.config.tabs;
  const crossSections = simulation.crossSections;

  const tabIndex = ui.tabIndex;
  const tabName = tabs[tabIndex];
  const handleTabChange = (newTabIndex: number) => {
    ui.setTabIndex(newTabIndex);
    log("SidePanelTabChanged", { value: tabs[newTabIndex] });
  };
  const tabEnabled = (name: "maps" | "graph" | "gauge1" | "gauge2" | "gauge3") => tabs.indexOf(name) !== -1;

  return (
    <Tabs className={`${css.tabs} ${tabBgColorCss[tabName]}`} selectedIndex={tabIndex} onSelect={handleTabChange}>
      <TabList className={`react-tabs__tab-list ${css.tabList}`}>
        {
          tabEnabled("maps") &&
          <Tab className={`${css.tab} ${css.mapsBorder}`} selectedClassName={css.tabSelected}>
            <div className={css.tabInsideContainer}>Maps</div>
          </Tab>
        }
        {
          tabEnabled("graph") &&
          <Tab className={`${css.tab} ${css.graphBorder}`} selectedClassName={css.tabSelected}>
            <div className={css.tabInsideContainer}>Graph</div>
          </Tab>
        }
        {
          crossSections.map((g, idx) => {
            if (!tabEnabled(`gauge${idx + 1}` as "gauge1" | "gauge2" | "gauge3")) {
              return null;
            }
            const Icon = GaugeMarker[idx];
            return (
              <Tab key={idx} className={`${css.tab} ${gaugeBorderColorCss[idx]}`} selectedClassName={css.tabSelected}>
                <div className={css.tabInsideContainer}>Gauge <Icon/></div>
              </Tab>
            );
          })
        }
      </TabList>


      {
        tabEnabled("maps") &&
        <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.mapsBorder}`}>
          <MapsTab/>
        </TabPanel>
      }
      {
        tabEnabled("graph") &&
        <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.graphBorder}`}>
          <FloodAreaGraph/>
        </TabPanel>
      }
      {
        crossSections.map((g, idx) => {
          if (!tabEnabled(`gauge${idx + 1}` as "gauge1" | "gauge2" | "gauge3")) {
            return null;
          }
          return (<TabPanel key={idx} className={`react-tabs__tab-panel ${css.tabPanel} ${gaugeBorderColorCss[idx]}`}>
              <GaugeTab gauge={idx}/>
            </TabPanel>
          );
        }
      )
      }
    </Tabs>
  );
});
