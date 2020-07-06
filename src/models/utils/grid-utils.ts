// Only four directions. It's important, as it makes less likely the river or fire line is accidentally crossed by the
// fire (e.g. when it's really narrow and drawn at 45* angle).
export const directNeighbors = [ {x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1} ];

export const withinDist = (x0: number, y0: number, x1: number, y1: number, maxDist: number) => {
  return (x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1) <= maxDist * maxDist;
};

export const getGridIndexForLocation = (gridX: number, gridY: number, width: number) => {
  return gridX + gridY * width;
};
