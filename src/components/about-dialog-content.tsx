import * as React from "react";
import { Copyright } from "../geohazard-components/top-bar/copyright";

export const AboutDialogContent = () => (
  <div>
    <p>
      Scientists use models to explore the occurrence and extent of floods. Use this model to explore factors that affect
      the severity and conditions of inland flooding such as the amount of rain, storm duration, and starting water level.
      This model also includes base maps of terrain, street view, and permeability that can further help investigate the
      causes and impacts of flooding.
    </p>
    <p>
      Use the Map tab window to select a basemap:  Street, Topographic, or Permeability.
    </p>
    <p>
      Adjust the initial starting environmental conditions in the bottom control bar.
    </p>
    <p>
      Click the play button to see a flood develop in the landscape. In which areas does flooding occur? How is the
      extent of flooding influenced by different environmental conditions?
    </p>
    <p>
      Check out the three different stream gauge cross sections for a view of how the height of the water table is
      linked to flood occurrence.
    </p>
    <p>
      Use levees to try to divert the flood waters and save certain areas of the city from being flooded. Which
      environmental conditions make it hardest to mitigate flooding?
    </p>
    <p>
      Flood Explorer was created
      by <a href="https://github.com/pjanik" target="_blank" rel="noreferrer">Piotr Janik</a> from <a href="https://concord.org"
      target="_blank" rel="noreferrer">the Concord Consortium.</a> This <a
      href="https://concord.org/our-work/research-projects/geohazard/" target="_blank" rel="noreferrer">GeoHazard</a> interactive
      was developed under <a href="https://nsf.gov/" target="_blank" rel="noreferrer">National Science Foundation</a> grant
      DRL-1812362.
    </p>
    <Copyright />
  </div>
);
