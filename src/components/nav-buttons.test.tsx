import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "mobx-react";
import userEvent from "@testing-library/user-event";
import { createStores } from "../models/stores";
import { NavButtons, zoomDistDiff } from "./nav-buttons";

import css from "./nav-buttons.scss";

describe("NavButtons component", () => {
  it("renders zoom in, zoom out and reset camera buttons", () => {
    const stores = createStores();
    render(<Provider stores={stores}><NavButtons /></Provider>);
    expect(screen.getByTestId("zoom-in")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-out")).toBeInTheDocument();
    expect(screen.getByTestId("reset-camera")).toBeInTheDocument();
  });

  describe("zoom in button", () => {
    it("changes camera distance and gets disabled when user reaches min distance", async () => {
      const stores = createStores();
      render(<Provider stores={stores}><NavButtons /></Provider>);
      const initialCameraDist = stores.ui.getCameraDistance();

      await userEvent.click(screen.getByTestId("zoom-in"));
      expect(stores.ui.getCameraDistance()).toEqual(initialCameraDist - zoomDistDiff);
      for (let i = 0; i <= 10; i++) {
        await userEvent.click(screen.getByTestId("zoom-in"));
      }
      expect(stores.ui.canZoomIn()).toEqual(false);
      expect(screen.getByTestId("zoom-in")).toHaveClass(css.disabled);
    });
  });

  describe("zoom out button", () => {
    it("changes camera distance and gets disabled when user reaches max distance", async () => {
      const stores = createStores();
      render(<Provider stores={stores}><NavButtons /></Provider>);
      const initialCameraDist = stores.ui.getCameraDistance();

      await userEvent.click(screen.getByTestId("zoom-out"));
      expect(stores.ui.getCameraDistance()).toEqual(initialCameraDist + zoomDistDiff);
      for (let i = 0; i <= 10; i++) {
        await userEvent.click(screen.getByTestId("zoom-out"));
      }
      expect(screen.getByTestId("zoom-out")).toHaveClass(css.disabled);
    });
  });

  describe("reset camera button", () => {
    it("is initially disabled and restores initial camera position", async () => {
      const stores = createStores();
      render(<Provider stores={stores}><NavButtons /></Provider>);

      expect(stores.ui.isCameraPosModified()).toEqual(false);
      expect(screen.getByTestId("reset-camera")).toHaveClass(css.disabled);

      await userEvent.click(screen.getByTestId("zoom-out"));
      expect(stores.ui.isCameraPosModified()).toEqual(true);
      expect(screen.getByTestId("reset-camera")).not.toHaveClass(css.disabled);

      await userEvent.click(screen.getByTestId("reset-camera"));
      expect(stores.ui.isCameraPosModified()).toEqual(false);
      expect(screen.getByTestId("reset-camera")).toHaveClass(css.disabled);
    });
  });
});
