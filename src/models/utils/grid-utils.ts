import { Cell } from "../cell";

export const withinDist = (x0: number, y0: number, x1: number, y1: number, maxDist: number) => {
  return (x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1) <= maxDist * maxDist;
};

export const getGridIndexForLocation = (gridX: number, gridY: number, width: number) => {
  return gridX + gridY * width;
};

export const cellAtGrid = (gridX: number, gridY: number, cells: Cell[], width: number, height: number) => {
  if (gridX < 0 || gridX >= width || gridY < 0 || gridY >= height) {
    return undefined;
  }
  return cells[getGridIndexForLocation(gridX, gridY, width)];
};

export const getCellNeighbors4 = (cell: Cell, cells: Cell[], width: number, height: number) => {
  return [
    cellAtGrid(cell.x - 1, cell.y, cells, width, height),
    cellAtGrid(cell.x + 1, cell.y, cells, width, height),
    cellAtGrid(cell.x, cell.y - 1, cells, width, height),
    cellAtGrid(cell.x, cell.y + 1, cells, width, height)
  ].filter(c => c !== undefined) as Cell[];
};

export const getCellNeighbors8 = (cell: Cell, cells: Cell[], width: number, height: number) => {
  return [
    cellAtGrid(cell.x - 1, cell.y, cells, width, height),
    cellAtGrid(cell.x + 1, cell.y, cells, width, height),
    cellAtGrid(cell.x, cell.y - 1, cells, width, height),
    cellAtGrid(cell.x, cell.y + 1, cells, width, height),
    cellAtGrid(cell.x - 1, cell.y - 1, cells, width, height),
    cellAtGrid(cell.x + 1, cell.y + 1, cells, width, height),
    cellAtGrid(cell.x - 1, cell.y + 1, cells, width, height),
    cellAtGrid(cell.x + 1, cell.y - 1, cells, width, height)
  ].filter(c => c !== undefined) as Cell[];
};
