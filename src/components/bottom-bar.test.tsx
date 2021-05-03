import React from "react";
import { mount } from "enzyme";
import { BottomBar } from "./bottom-bar";
import css from "./bottom-bar.scss";
import { storesContext } from "../use-stores";
import { IStores, createStores } from "../models/stores";

export const StoreProvider = ({ stores, children }: { stores: IStores, children: any }) => {
  return <storesContext.Provider value={stores}>{children}</storesContext.Provider>;
};

describe("BottomBar", () => {
  it("renders basic widgets", () => {
    const wrapper = mount(<BottomBar />);
    expect(wrapper.find('[data-test="rain-intensity"]').hostNodes().length).toEqual(1);
    expect(wrapper.find('[data-test="starting-water-level"]').hostNodes().length).toEqual(1);
    expect(wrapper.find('[data-test="rain-duration-select"]').hostNodes().length).toEqual(1);
    expect(wrapper.find('[data-test="time-slider"]').hostNodes().length).toEqual(1);
    expect(wrapper.find('[data-test="levees-button"]').hostNodes().length).toEqual(1);
    expect(wrapper.find('[data-test="reload-button"]').hostNodes().length).toEqual(1);
    expect(wrapper.find('[data-test="restart-button"]').hostNodes().length).toEqual(1);
    expect(wrapper.find('[data-test="start-stop-button"]').hostNodes().length).toEqual(1);

  });

  it("disabled play button when model isn't ready yet", () => {
    const stores = createStores();
    const wrapper = mount(<StoreProvider stores={stores}><BottomBar /></StoreProvider>);
    expect(wrapper.find('[data-test="start-stop-button"]').at(0).prop("disabled")).toEqual(true);
    stores.simulation.dataReady = true;
    wrapper.update();
    expect(wrapper.find('[data-test="start-stop-button"]').at(0).prop("disabled")).toEqual(false);
  });

  it("disables rain components when model is started", () => {
    const stores = createStores();
    const wrapper = mount(<StoreProvider stores={stores}><BottomBar /></StoreProvider>);
    expect(wrapper.find('[data-test="rain-intensity"]').at(0).prop("disabled")).toEqual(false);
    expect(wrapper.find('[data-test="starting-water-level"]').at(0).prop("disabled")).toEqual(false);
    expect(wrapper.find('[data-test="rain-duration"]').at(0).hasClass(css.disabled)).toEqual(false);
    stores.simulation.simulationStarted = true;
    wrapper.update();
    expect(wrapper.find('[data-test="rain-intensity"]').at(0).prop("disabled")).toEqual(true);
    expect(wrapper.find('[data-test="starting-water-level"]').at(0).prop("disabled")).toEqual(true);
    expect(wrapper.find('[data-test="rain-duration"]').at(0).hasClass(css.disabled)).toEqual(true);
  });
});
