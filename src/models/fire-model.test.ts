import { getFireSpreadTime, LandType } from "./fire-model";
import { UNBURNT } from "./simulation";

describe("fire model", () => {

  it("calculates the fireSpreadTime correctly", () => {
    const sourceCell = {
      x: 0,
      y: 0,
      landType: LandType.Forest,
      elevation: 0,
      fire: UNBURNT
    };

    const targetCell = {
      x: 1,
      y: 0,
      landType: LandType.Forest,
      elevation: 0,
      fire: UNBURNT
    };

    const spreadTime = getFireSpreadTime(sourceCell, targetCell, 88);
    expect(spreadTime).toBeCloseTo(0.122);
  });

});
