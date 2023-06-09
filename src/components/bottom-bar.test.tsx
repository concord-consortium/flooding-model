import React from "react";
import { act, render, screen } from "@testing-library/react";
import { BottomBar } from "./bottom-bar";
import { Provider } from "mobx-react";
import { createStores } from "../models/stores";

describe("BottomBar", () => {
  it("renders basic widgets", () => {
    const stores = createStores();
    render(<Provider stores={stores}><BottomBar /></Provider>);
    expect(screen.getByTestId("rain-intensity")).toBeInTheDocument();
    expect(screen.getByTestId("starting-water-level")).toBeInTheDocument();
    expect(screen.getByTestId("rain-duration-select")).toBeInTheDocument();
    expect(screen.getByTestId("time-slider")).toBeInTheDocument();
    expect(screen.getByTestId("levees-button")).toBeInTheDocument();
    expect(screen.getByTestId("reload-button")).toBeInTheDocument();
    expect(screen.getByTestId("restart-button")).toBeInTheDocument();
    expect(screen.getByTestId("start-stop-button")).toBeInTheDocument();
  });

  it("disables play button when model isn't ready yet", () => {
    const stores = createStores();
    render(<Provider stores={stores}><BottomBar /></Provider>);
    expect(screen.getByTestId("start-stop-button")).toBeDisabled();
    act(() => {
      stores.simulation.dataReady = true;
    });
    expect(screen.getByTestId("start-stop-button")).toBeEnabled();
  });

  it("disables rain components when model is started", () => {
    const stores = createStores();
    render(<Provider stores={stores}><BottomBar /></Provider>);
    expect(screen.getByTestId("rain-intensity")).not.toHaveClass("Mui-disabled");
    expect(screen.getByTestId("starting-water-level")).not.toHaveClass("Mui-disabled");
    expect(screen.getByTestId("rain-duration")).not.toHaveClass("disabled");
    act(() => {
      stores.simulation.simulationStarted = true;
    });
    expect(screen.getByTestId("rain-intensity")).toHaveClass("Mui-disabled");
    expect(screen.getByTestId("starting-water-level")).toHaveClass("Mui-disabled");
    expect(screen.getByTestId("rain-duration")).toHaveClass("disabled");
  });
});
