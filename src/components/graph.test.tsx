import React from "react";
import { mount } from "enzyme";
import { Graph } from "./graph";
import { Scatter } from "react-chartjs-2";
import { ChartData } from "chart.js";
import { act } from "react-dom/test-utils";

jest.mock("react-chartjs-2", () => ({
  Scatter: () => null,
  defaults: { global: {} }
}));

describe("Graph", () => {
  let fontsResolve: () => void;

  beforeEach(() => {
    (document as any).fonts = {
      ready: new Promise(resolve => { fontsResolve = resolve; })
    };
  });

  it("renders ChartJS Scatter graph with provided props", () => {
    const points = [{x: 0, y: 0}, {x: 10, y: 10}];
    const wrapper = mount(<Graph points={points} maxX={321} maxY={123} yLabel="test Y label" />);
    expect(wrapper.find(Scatter).length).toEqual(1);

    const scatter = wrapper.find(Scatter).first();

    const data = scatter.prop("data") as ChartData;
    expect(data.datasets?.[0].data).toEqual(points);

    const options = scatter.prop("options");
    expect(options?.scales?.xAxes?.[0].ticks?.max).toEqual(321);
    expect(options?.scales?.yAxes?.[0].ticks?.max).toEqual(123);
    expect(options?.scales?.yAxes?.[0].scaleLabel?.labelString).toEqual("test Y label");
  });

  it("extends maxX when necessary", () => {
    const points = [{x: 0, y: 0}, {x: 15, y: 10}];
    const wrapper = mount(<Graph points={points} maxX={10} />);
    expect(wrapper.find(Scatter).length).toEqual(1);

    const scatter = wrapper.find(Scatter).first();

    const options = scatter.prop("options");
    expect(options?.scales?.xAxes?.[0].ticks?.max).toEqual(17); // Math.round(15 + 0.15 * 10)
  });

  it("re-renders Chart when fonts are loaded", async () => {
    const points = [{x: 0, y: 0}, {x: 15, y: 10}];
    const wrapper = mount(<Graph points={points} maxX={10} />);
    expect(wrapper.find(Scatter).length).toEqual(1);

    expect(wrapper.find(Scatter).first().key()).toEqual("0");
    await act(async () => {
      await fontsResolve();
    });
    wrapper.update();
    expect(wrapper.find(Scatter).first().key()).toEqual("1");
  });
});
