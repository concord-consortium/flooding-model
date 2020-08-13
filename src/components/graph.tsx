import React, { useEffect, useState } from "react";
import { Scatter, defaults } from "react-chartjs-2";

defaults.global.defaultFontFamily = "Roboto Condensed";
defaults.global.defaultFontSize = 14;
defaults.global.defaultFontColor = "#434343";

const LINE_COLOR = "#50acff";

interface IProps {
  points: { x: number, y: number }[];
  yLabel?: string;
  maxX?: number;
  maxY?: number;
}

export const Graph: React.FC<IProps> = ({ points, yLabel, maxX = 14, maxY = 100 }) => {
  const [currentMaxX, setCurrentMaxX] = useState<number>(maxX);
  const [key, setKey] = useState<number>(0); // used to force re-render graph after fonts are ready.

  // Wait for fonts to be loaded and re-render the graph.
  useEffect(() => {
    (document as any).fonts.ready.then(() => {
      setKey(oldKey => oldKey + 1);
    });
  }, []);

  if (points.length > 0 && points[points.length - 1].x > currentMaxX) {
    // Extend X axis, add 15% of the initial maxX value.
    setCurrentMaxX(Math.round(points[points.length - 1].x + maxX * 0.15));
  }

  return (
    <Scatter
      key={key} // used to force re-render graph after fonts are loaded
      data={{
        datasets: [
          {
            borderColor: LINE_COLOR,
            pointBorderColor: LINE_COLOR,
            pointBackgroundColor: LINE_COLOR,
            pointRadius: 0,
            lineTension: 0.2,
            showLine: true,
            fill: false,
            data: points
          }
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        animation: {
          duration: 0
        },
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: yLabel
            },
            ticks: {
              min: 0,
              max: maxY,
              maxTicksLimit: 20
            }
          }],
          xAxes: [{
            ticks: {
              min: 0,
              max: currentMaxX,
              maxTicksLimit: 20
            },
            scaleLabel: {
              display: true,
              labelString: "Time (days)"
            },
          }]
        },
      }}
    />
  );
};
