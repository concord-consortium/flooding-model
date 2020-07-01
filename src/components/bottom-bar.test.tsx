import React from "react";
import { mount } from "enzyme";
import { createStores } from "../models/stores";
import { Provider } from "mobx-react";
import { BottomBar } from "./bottom-bar";

describe("BottomBar component", () => {
  let stores = createStores();
  beforeEach(() => {
    stores = createStores();
  });

  describe("restart button", () => {
    it("restarts simulation", () => {
      jest.spyOn(stores.simulation, "restart");
      const wrapper = mount(
        <Provider stores={stores}>
          <BottomBar />
        </Provider>
      );
      wrapper.find('[data-test="restart-button"]').first().simulate("click");
      expect(stores.simulation.restart).toHaveBeenCalled();
    });
  });

  describe("reload button", () => {
    it("resets simulation and resets view", () => {
      jest.spyOn(stores.simulation, "reload");
      const wrapper = mount(
        <Provider stores={stores}>
          <BottomBar />
        </Provider>
      );
      wrapper.find('[data-test="reload-button"]').first().simulate("click");
      expect(stores.simulation.reload).toHaveBeenCalled();
    });
  });
});
