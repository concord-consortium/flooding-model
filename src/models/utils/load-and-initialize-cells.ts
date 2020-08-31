import { getElevationData, getPermeabilityData, getRiverData, getWaterDepthData } from "./data-loaders";
import { getGridIndexForLocation, getCellNeighbors4, getCellNeighbors8 } from "./grid-utils";
import { Cell } from "../cell";
import { ISimulationConfig } from "../../config";

// River is not flowing in the model. Instead, it disappears from the river faster than from the ground.
const RIVER_PERMEABILITY = 0.012;

export const populateCellsData = async (config: ISimulationConfig) => {
  return Promise.all([
    getElevationData(config), getRiverData(config), getWaterDepthData(config), getPermeabilityData(config)
  ]).then(values => {
    const elevation = values[0];
    const river = values[1];
    const waterDepth = values[2];
    const permeability = values[3];
    const elevationDiff = config.maxElevation - config.minElevation;
    const verticalTilt = (config.elevationVerticalTilt / 100) * elevationDiff;

    const cells = [];
    const riverCells = [];
    const edgeCells = [];

    for (let y = 0; y < config.gridHeight; y++) {
      for (let x = 0; x < config.gridWidth; x++) {
        const index = getGridIndexForLocation(x, y, config.gridWidth);
        const isRiver = river && river[index] > 0;
        // When fillTerrainEdge is set to true, edges are set to elevation 0.
        const isEdge = config.fillTerrainEdges &&
          (x === 0 || x === config.gridWidth - 1 || y === 0 || y === config.gridHeight - 1);
        let baseElevation = elevation && elevation[index];
        if (verticalTilt && baseElevation !== undefined) {
          const vertProgress = y / config.gridHeight;
          baseElevation += Math.abs(verticalTilt) * (verticalTilt > 0 ? vertProgress : 1 - vertProgress);
        }
        if (isEdge) {
          baseElevation = 0;
        }
        const cell = new Cell({
          id: index,
          x, y,
          isEdge,
          isRiver,
          baseElevation,
          waterDepth: waterDepth && waterDepth[index] || 0,
          permeability: isRiver ? RIVER_PERMEABILITY : (permeability && permeability[index] || 0)
        });

        cells.push(cell);

        if (cell.isRiver) {
          riverCells.push(cell);
        }
        if (cell.isEdge) {
          edgeCells.push(cell);
        }
      }
    }
    const shoreIdx = markShoreIndices(edgeCells, cells, config);
    const riverBankSegments = markRiverBanks(edgeCells, cells, shoreIdx, config);

    return {
      cells,
      edgeCells,
      riverCells,
      riverBankSegments
    };
  });
};

// Model area is divided into distinct areas by rivers. Each area will get different index. Useful while generating
// river bank segments (to ensure that one segment doesn't cross the river).
export const markShoreIndices = (edgeCells: Cell[], cells: Cell[], config: ISimulationConfig) => {
  let currentShoreIdx = 0;
  const shoreIdx: {[key: number]: number} = {};

  const markShoreArea = (cell: Cell) => {
    shoreIdx[cell.id] = currentShoreIdx;
    const queue = [cell];
    while (queue.length > 0) {
      const c = queue.shift();
      if (!c) {
        continue;
      }
      getCellNeighbors4(c, cells, config.gridWidth, config.gridHeight).forEach(n => {
        if (!n.isRiver && shoreIdx[n.id] === undefined) {
          shoreIdx[n.id] = currentShoreIdx;
          queue.push(n);
        }
      });
    }
    currentShoreIdx += 1;
  };

  for (const cell of edgeCells) {
    if (!cell.isRiver && shoreIdx[cell.id] === undefined) {
      markShoreArea(cell);
    }
  }

  return shoreIdx;
};

export const markRiverBanks = (edgeCells: Cell[], cells: Cell[], shoreIdx: {[key: number]: number}, config: ISimulationConfig) => {
  const isRiverBank = (cell: Cell) => {
    if (cell.isRiver) {
      return false;
    }
    let result = false;
    getCellNeighbors4(cell, cells, config.gridWidth, config.gridHeight).forEach(n => {
      if (n && n.isRiver) {
        result = true;
      }
    });
    return result;
  };

  const expectedSegmentLength = Math.round(config.riverBankSegmentLength / config.cellSize);
  const riverBankSegments: Cell[][] = [];
  const queue = [];

  for (const cell of edgeCells) {
    if (isRiverBank(cell)) {
      cell.isRiverBank = true;
      const segment = [cell];
      riverBankSegments.push(segment);
      cell.riverBankSegmentIdx = riverBankSegments.length - 1;
      queue.push(cell);
    }
  }

  while (queue.length > 0) {
    const cell = queue.shift() as Cell;
    const neighbors = getCellNeighbors8(cell, cells, config.gridWidth, config.gridHeight);
    let foundNeigh = false;
    for (const n of neighbors) {
      // A few conditions here:
      // - follow just one neighbor, don't add more than one to the queue. It ensures that segments don't have forks.
      // - check if shoreIdx properties are equal. It ensures that one segment won't cross the river.
      if (!foundNeigh && n && !n.isRiverBank && shoreIdx[n.id] === shoreIdx[cell.id] && !n.isRiver && isRiverBank(n)) {
        foundNeigh = true;
        queue.push(n);
        n.isRiverBank = true;
        // Divide river banks into segments. Note that new segments are created by splitting the previous one into
        // two pieces. Why? Otherwise, we would end up with some very short segments when two segments approach
        // each other from two different directions. Creating too long segments and dividing them into two ensures
        // that segments will be always as long as we expect, and sometimes they can be even longer (what looks
        // better than too short ones).
        const prevSegment = riverBankSegments[cell.riverBankSegmentIdx];
        // * 2 ensures that we'll split a segment only when we can create two new ones that will have length
        // close to the desired segment length.
        if (prevSegment.length < expectedSegmentLength * 2) {
          prevSegment.push(n);
          n.riverBankSegmentIdx = cell.riverBankSegmentIdx;
        } else {
          const newSegment = prevSegment.slice(expectedSegmentLength);
          newSegment.push(n);
          riverBankSegments.push(newSegment);
          newSegment.forEach(c => { c.riverBankSegmentIdx = riverBankSegments.length - 1; });
          // Limit length of the previous segment.
          prevSegment.length = Math.min(expectedSegmentLength, prevSegment.length);
        }
      }
    }
  }
  return riverBankSegments;
};
