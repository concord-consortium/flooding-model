export const withinDist = (x0: number, y0: number, x1: number, y1: number, maxDist: number) => {
  return (x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1) <= maxDist * maxDist;
};

export const getGridIndexForLocation = (gridX: number, gridY: number, width: number) => {
  return gridX + gridY * width;
};
