import { FloodingEngine } from "./flooding-engine";
import { Cell } from "../cell";
import { RiverStage } from "../simulation";

describe("FloodingEngine", () => {
  it("organizes Cells into arrays when initialized", () => {
    const cells = [
      new Cell({ x: 0, y: 0, isRiver: true }),
      new Cell({ x: 0, y: 0, isEdge: true, isRiver: true }),
      new Cell({ x: 0, y: 0 }),
      new Cell({ x: 0, y: 0 })
    ];
    const engine = new FloodingEngine(cells, {
      gridWidth: 2,
      gridHeight: 2,
      cellSize: 1,
      timeStep: 1
    });

    expect(engine.cells).toEqual(cells);
    expect(engine.riverCells.length).toEqual(1); // edges shouldn't be counted as rivers
    expect(engine.activeCells.length).toEqual(3);
  });

  it("conserves water mass", () => {
    const c1 = new Cell({ x: 0, y: 0, waterDepth: 1 });
    const c2 = new Cell({ x: 1, y: 0 });
    const c3 = new Cell({ x: 0, y: 1 });
    const c4 = new Cell({ x: 1, y: 1 });
    const cells = [c1, c2, c3, c4];
    const engine = new FloodingEngine(cells, {
      gridWidth: 2,
      gridHeight: 2,
      cellSize: 1,
      dampingFactor: 0.97, // to stabilize fluid faster
      timeStep: 0.1
    });

    // Why 300 steps and 0.1 timestep? It's been adjusted based on experiments for this particular setup.
    // It's important that model conserves water mass and ends up in the equilibrum state.
    for (let i = 0; i < 300; i += 1) {
      engine.update();
      expect(engine.waterSum).toBeCloseTo(1, 5);
    }
    expect(c1.waterDepth).toBeCloseTo(0.25);
    expect(c2.waterDepth).toBeCloseTo(0.25);
    expect(c3.waterDepth).toBeCloseTo(0.25);
    expect(c4.waterDepth).toBeCloseTo(0.25);
  });

  describe("getCellAt", () => {
    it("returns cell at x, y coords", () => {
      const c1 = new Cell({ x: 0, y: 0 });
      const c2 = new Cell({ x: 1, y: 0 });
      const c3 = new Cell({ x: 0, y: 1 });
      const c4 = new Cell({ x: 1, y: 1 });
      const cells = [c1, c2, c3, c4];
      const engine = new FloodingEngine(cells, {
        gridWidth: 2,
        gridHeight: 2,
        cellSize: 1,
        timeStep: 1
      });
      expect(engine.getCellAt(0, 0)).toEqual(c1);
      expect(engine.getCellAt(1, 0)).toEqual(c2);
      expect(engine.getCellAt(0, 1)).toEqual(c3);
      expect(engine.getCellAt(1, 1)).toEqual(c4);
    });
  });

  describe("updateFlux", () => {
    it("should calculate flux (outflow) following cell elevation", () => {
      const c1 = new Cell({ x: 0, y: 0, baseElevation: 1, waterDepth: 1 });
      const c2 = new Cell({ x: 1, y: 0, baseElevation: 0, waterDepth: 1 });
      const c3 = new Cell({ x: 0, y: 1, baseElevation: 0 });
      const c4 = new Cell({ x: 1, y: 1, baseElevation: 0 });
      const cells = [c1, c2, c3, c4];
      const engine = new FloodingEngine(cells, {
        gridWidth: 2,
        gridHeight: 2,
        cellSize: 1,
        timeStep: 1
      });
      engine.updateFlux(1);
      expect(c1.fluxOut).toBeGreaterThan(0);
      expect(c1.fluxR).toBeGreaterThan(0);
      expect(c1.fluxT).toBeGreaterThan(0);
      expect(c1.fluxL).toEqual(0); // no flow out of the edge
      expect(c1.fluxB).toEqual(0); // no flow out of the edge

      expect(c2.fluxOut).toBeGreaterThan(0);
      expect(c2.fluxT).toBeGreaterThan(0);
      expect(c2.fluxL).toEqual(0); // fluxL is only outflux, water is coming from that direction
      expect(c2.fluxB).toEqual(0); // no flow out of the edge
      expect(c2.fluxR).toEqual(0); // no flow out of the edge

      expect(c3.fluxOut).toEqual(0);
      expect(c4.fluxOut).toEqual(0);
    });

    it("should make sure that fluxOut is not bigger than available water", () => {
      const c1 = new Cell({ x: 0, y: 0, baseElevation: 1, waterDepth: 0.1 });
      const c2 = new Cell({ x: 1, y: 0, baseElevation: 0, waterDepth: 0 });
      const c3 = new Cell({ x: 0, y: 1, baseElevation: 0 });
      const c4 = new Cell({ x: 1, y: 1, baseElevation: 0 });
      const cells = [c1, c2, c3, c4];
      const engine = new FloodingEngine(cells, {
        gridWidth: 2,
        gridHeight: 2,
        cellSize: 1,
        timeStep: 1
      });
      engine.updateFlux(1);
      expect(c1.fluxOut).toBeGreaterThan(0);
      expect(c1.fluxOut).toBeLessThanOrEqual(0.1);
      expect(c1.fluxR).toBeGreaterThan(0);
      expect(c1.fluxT).toBeGreaterThan(0);
      expect(c1.fluxL).toEqual(0); // no flow out of the edge
      expect(c1.fluxB).toEqual(0); // no flow out of the edge

      expect(c2.fluxOut).toEqual(0);
      expect(c3.fluxOut).toEqual(0);
      expect(c4.fluxOut).toEqual(0);
    });
  });

  describe("updateWaterDepth", () => {
    it("should calculate flux (outflow) following cell elevation", () => {
      const c1 = new Cell({ x: 0, y: 0, waterDepth: 2 });
      const c2 = new Cell({ x: 1, y: 0 });
      const c3 = new Cell({ x: 0, y: 1 });
      const c4 = new Cell({ x: 1, y: 1 });
      const cells = [c1, c2, c3, c4];
      const engine = new FloodingEngine(cells, {
        gridWidth: 2,
        gridHeight: 2,
        cellSize: 1,
        timeStep: 1
      });

      c1.fluxR = 1;
      c1.fluxT = 1;
      engine.updateWaterDepth(1);

      expect(c1.waterDepth).toEqual(0);
      expect(c2.waterDepth).toEqual(1);
      expect(c3.waterDepth).toEqual(1);
      expect(c4.waterDepth).toEqual(0);
    });
  });

  describe("addWater", () => {
    it("should add water using waterSaturationIncrement value, first incrementing waterSaturation, then waterDepth", () => {
      const c1 = new Cell({ x: 0, y: 0, waterDepth: 0, isRiver: true });
      const c2 = new Cell({ x: 1, y: 0, waterDepth: 0, isRiver: false });
      const cells = [c1, c2];
      const engine = new FloodingEngine(cells, {
        gridWidth: 2,
        gridHeight: 1,
        cellSize: 1,
        timeStep: 1
      });

      c1.initialWaterSaturation = 0.5;
      c1.waterSaturation = 0.5;
      c2.initialWaterSaturation = 0.5;
      c2.waterSaturation = 0.5;

      engine.waterSaturationIncrement = 1;
      engine.addWater(4);

      expect(c1.waterSaturation).toEqual(1); // + 1 * 4 * 0.125
      expect(c1.waterDepth).toEqual(0);
      expect(c2.waterSaturation).toEqual(1);
      expect(c2.waterDepth).toEqual(0);

      engine.addWater(2);
      expect(c1.waterSaturation).toBeGreaterThan(1); // + 1 * 2 * 0.125
      expect(c1.waterDepth).toEqual(0);
      expect(c2.waterSaturation).toBeGreaterThan(1);
      expect(c2.waterDepth).toEqual(0);

      // Now waterDepth should start increasing (but only in river!), as waterSaturation is already > 1.
      engine.addWater(2);
      expect(c1.waterSaturation).toBeGreaterThan(1);
      expect(c1.waterDepth).toEqual(2); // + 1 * 2
      expect(c2.waterDepth).toEqual(0); // non-river cells don't get surface water

      // Start reverse process.
      engine.waterSaturationIncrement = -1;
      engine.addWater(1);
      expect(c1.waterSaturation).toBeGreaterThan(1);
      expect(c1.waterDepth).toEqual(1); // - 1 * 1
      expect(c2.waterSaturation).toEqual(0.875);
      expect(c2.waterDepth).toEqual(0);

      engine.addWater(1);
      expect(c1.waterSaturation).toEqual(1); // waterSaturation should be reset to 1 when waterDepth reaches 0.
      expect(c1.waterDepth).toEqual(0);
      expect(c2.waterSaturation).toEqual(0.75);
      expect(c2.waterDepth).toEqual(0);

      engine.addWater(1);
      expect(c1.waterSaturation).toEqual(0.875); // - 1 * 1 * 0.125
      expect(c1.waterDepth).toEqual(0);
      expect(c2.waterSaturation).toEqual(RiverStage.high); // min waterSaturation is equal to Math.min(initialWaterSaturation + 0.2, RiverStage.high)
      expect(c2.waterDepth).toEqual(0);

      engine.addWater(12);
      expect(c1.waterSaturation).toEqual(RiverStage.high); // min waterSaturation is equal to Math.min(initialWaterSaturation + 0.2, RiverStage.high)
      expect(c1.waterDepth).toEqual(0);
      expect(c2.waterSaturation).toEqual(RiverStage.high);
      expect(c2.waterDepth).toEqual(0);
    });
  });

  describe("removeWater", () => {
    it("should remove water each step using permeability and floodPermeabilityMult", () => {
      const c1 = new Cell({ x: 0, y: 0, waterDepth: 1, permeability: 0.1 });
      const c2 = new Cell({ x: 1, y: 0, waterDepth: 2, permeability: 0.5 });
      const cells = [c1, c2];
      const engine = new FloodingEngine(cells, {
        gridWidth: 2,
        gridHeight: 1,
        cellSize: 1,
        timeStep: 1
      });

      engine.removeWater(2);

      expect(c1.waterDepth).toEqual(0.8);
      expect(c2.waterDepth).toEqual(1);

      engine.waterSaturationIncrement = 1; // flood is in progress
      engine.floodPermeabilityMult = 0.5; // mult permeability by 0.5

      engine.removeWater(2);

      expect(c1.waterDepth).toBeCloseTo(0.7);
      expect(c2.waterDepth).toBeCloseTo(0.5);
    });
  });
});
