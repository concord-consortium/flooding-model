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
  const expectedSegmentLength = Math.round(config.riverBankSegmentLength / config.cellSize);
  const riverBankSegments: Cell[][] = [];

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

  const processRiverBank = (startCell: Cell) => { 
    const queue = [ startCell ];
    const neighborsCount: { [key: number]: number } = {};
    const processed: { [key: number]: boolean } = {};

    while (queue.length > 0) {
      const cell = queue.pop() as Cell;
      // Divide river banks into segments. Note that new segments are created by splitting the previous one into
      // two pieces. Why? Otherwise, we would end up with some very short segments when two segments approach
      // each other from two different directions. Creating too long segments and dividing them into two ensures
      // that segments will be always as long as we expect, and sometimes they can be even longer (what looks
      // better than too short ones).
      const prevSegment = riverBankSegments[riverBankSegments.length - 1];
      // * 2 ensures that we'll split a segment only when we can create two new ones that will have length
      // close to the desired segment length.
      if (prevSegment.length < expectedSegmentLength * 2) {
        prevSegment.push(cell);
        const lastSegmentIdx = riverBankSegments.length - 1;
        cell.riverBankSegmentIdx = lastSegmentIdx;
      } else {
        // `expectedSegmentLength - 1` => note that the last point of the previous segment is copied to the new one.
        // It ensures that there are no gaps between segments.
        const newSegment = prevSegment.slice(expectedSegmentLength - 1);
        // Limit length of the previous segment.
        prevSegment.length = expectedSegmentLength;
        newSegment.push(cell);
        riverBankSegments.push(newSegment);
        const lastSegmentIdx = riverBankSegments.length - 1;
        newSegment.forEach(c => { c.riverBankSegmentIdx = lastSegmentIdx; });
      }
      cell.isRiverBank = true;

      const neighbors = getCellNeighbors8(cell, cells, config.gridWidth, config.gridHeight);
      neighborsCount[cell.id] = 0;
      for (const n of neighbors) {
        // Check if shoreIdx properties are equal. It ensures that one segment won't cross the river.
        if (n && !processed[n.id] && shoreIdx[n.id] === shoreIdx[cell.id] && !n.isRiver && isRiverBank(n)) {
          neighborsCount[cell.id] += 1;
          queue.push(n);
          processed[n.id] = true;
        }
      }
      // Handle special cases.
      // 1. Dead end. No way to continue river bank, but it's not edge of the map yet. 
      //    Remove this path unless the path fork is reached. Algorithm will continue from this fork.
      if (neighborsCount[cell.id] === 0 && !cell.isEdge) {
        const lastSegment = riverBankSegments[riverBankSegments.length - 1];
        while (lastSegment[lastSegment.length - 1] && neighborsCount[lastSegment[lastSegment.length - 1].id] <= 1) {
          const removedCell = lastSegment.pop();
          if (removedCell) {
            removedCell.isRiverBank = false;
            removedCell.riverBankSegmentIdx = undefined;
          }
        }
        if (lastSegment[lastSegment.length - 1]) {
          // One less neighbor, as one path has just been removed.
          neighborsCount[lastSegment[lastSegment.length - 1].id] -= 1;
        }
      }
      // 2. DFS reached the other end of the map. Finish DFS, remove everything from the queue.
      if (cell.isEdge && cell.id !== startCell.id) {
        queue.length = 0;
      }
    }
  };  

  const shoreProcessed: {[key: number]: boolean} = {};
  for (const cell of edgeCells) {
    if (isRiverBank(cell) && !shoreProcessed[shoreIdx[cell.id]]) {
      cell.isRiverBank = true;
      riverBankSegments.push([]);
      processRiverBank(cell);
      // Mark shore area as processed so the algorithm doesn't start again in the same area. This will ensure
      // that river banks will start in one map edge and finish in the other.
      shoreProcessed[shoreIdx[cell.id]] = true;
    }
  }

  return riverBankSegments;
};
