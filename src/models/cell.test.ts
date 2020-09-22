import { Cell } from "./cell";

describe("Cell", () => {
  describe("fluxOut", () => {
    it("returns sum of all flux components", () => {
      const c = new Cell({ x: 0, y: 0 });
      c.fluxL = 1;
      c.fluxR = 2;
      c.fluxT = 3;
      c.fluxB = 4;
      expect(c.fluxOut).toEqual(10);
    });
  });

  describe("isLevee", () => {
    it("returns true is there's any levee", () => {
      const c = new Cell({ x: 0, y: 0 });
      c.leveeHeight = 2;
      expect(c.isLevee).toEqual(true);
    });
  });

  describe("elevation", () => {
    it("returns sum baseElevation, waterDepth and leeve", () => {
      const c = new Cell({ x: 0, y: 0, baseElevation: 1, waterDepth: 2 });
      c.leveeHeight = 3;
      expect(c.elevation).toEqual(6);
    });
  });


  describe("reset", () => {
    it("resets waterDepth and flux", () => {
      const c = new Cell({ x: 0, y: 0 });
      c.fluxL = 1;
      c.fluxR = 2;
      c.fluxT = 3;
      c.fluxB = 4;
      c.waterDepth = 5;
      c.waterSaturation = 6;
      c.reset();
      expect(c.fluxOut).toEqual(0);
      expect(c.fluxL).toEqual(0);
      expect(c.fluxR).toEqual(0);
      expect(c.fluxT).toEqual(0);
      expect(c.fluxB).toEqual(0);
      expect(c.waterDepth).toEqual(0);
      expect(c.waterSaturation).toEqual(0);
    });
  });
});
