import React from "react";
import { mount } from "enzyme";
import { createStores } from "../models/stores";
import { StoreProvider } from "./bottom-bar.test";
import { NavButtons, zoomDistDiff } from "./nav-buttons";

import css from "./nav-buttons.scss";

describe("NavButtons component", () => {
  it("renders zoom in, zoom out and reset camera buttons", () => {
    const stores = createStores();
    const wrapper = mount(<StoreProvider stores={stores}><NavButtons /></StoreProvider>);
    expect(wrapper.find('[data-test="zoom-in"]').hostNodes().length).toEqual(1);
    expect(wrapper.find('[data-test="zoom-out"]').hostNodes().length).toEqual(1);
    expect(wrapper.find('[data-test="reset-camera"]').hostNodes().length).toEqual(1);
  });

  describe("zoom in button", () => {
    it("changes camera distance and gets disabled when user reaches min distance", () => {
      const stores = createStores();
      const wrapper = mount(<StoreProvider stores={stores}><NavButtons /></StoreProvider>);
      const initialCameraDist = stores.ui.getCameraDistance();

      wrapper.find('[data-test="zoom-in"]').simulate("click");
      expect(stores.ui.getCameraDistance()).toEqual(initialCameraDist - zoomDistDiff);
      for (let i = 0; i <= 10; i++) {
        wrapper.find('[data-test="zoom-in"]').simulate("click");
      }
      expect(wrapper.find('[data-test="zoom-in"]').at(0).hasClass(css.disabled)).toEqual(true);
    });
  });

  describe("zoom out button", () => {
    it("changes camera distance and gets disabled when user reaches max distance", () => {
      const stores = createStores();
      const wrapper = mount(<StoreProvider stores={stores}><NavButtons /></StoreProvider>);
      const initialCameraDist = stores.ui.getCameraDistance();

      wrapper.find('[data-test="zoom-out"]').simulate("click");
      expect(stores.ui.getCameraDistance()).toEqual(initialCameraDist + zoomDistDiff);
      for (let i = 0; i <= 10; i++) {

        wrapper.find('[data-test="zoom-out"]').simulate("click");
      }
      expect(wrapper.find('[data-test="zoom-out"]').at(0).hasClass(css.disabled)).toEqual(true);
    });
  });

  describe("reset camera button", () => {
    it("is initially disabled and restores initial camera position", () => {
      const stores = createStores();
      const wrapper = mount(<StoreProvider stores={stores}><NavButtons /></StoreProvider>);

      expect(stores.ui.isCameraPosModified()).toEqual(false);
      expect(wrapper.find('[data-test="reset-camera"]').at(0).hasClass(css.disabled)).toEqual(true);

      wrapper.find('[data-test="zoom-out"]').simulate("click");
      expect(stores.ui.isCameraPosModified()).toEqual(true);
      expect(wrapper.find('[data-test="reset-camera"]').at(0).hasClass(css.disabled)).toEqual(false);

      wrapper.find('[data-test="reset-camera"]').simulate("click");
      expect(stores.ui.isCameraPosModified()).toEqual(false);
      expect(wrapper.find('[data-test="reset-camera"]').at(0).hasClass(css.disabled)).toEqual(true);
    });
  });
});
