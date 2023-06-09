import * as React from "react";
import { Copyright } from "../geohazard-components/top-bar/copyright";

export const AboutDialogContent = () => (
  <div>
    <p>
      Scientists use models to explore the occurrence and extent of floods.. Use this model to investigate factors that
      affect the location and severity of flooding along an inland river city such as the amount of rain, storm
      duration, and starting water level. This model also includes a variety of maps that enable investigations of the
      causes and impacts of flooding.
    </p>
    <p>
      Adjust the starting environmental conditions in the bottom control bar.
    </p>
    <p>
      Click the Play button to see a flood develop in the landscape. In which areas does flooding occur? How is the
      extent of flooding influenced by different environmental conditions?
    </p>
    <p>
      Check out the three different stream gauge cross sections for a view of how the height of the water table is
      linked to flooding.
    </p>
    <p>
      Use the Graph tab to see the number of acres flooded and the speed at which flood waters rise and recede.
    </p>
    <p>
      Place levees along the river to mitigate the risk of flooding. How does the human development of land along the
      river affect flood risks and impacts for people living and working nearby?
    </p>
    <p>
      Flood Explorer was created
      by <a href="https://github.com/pjanik" target="_blank" rel="noreferrer">Piotr Janik</a> from <a href="https://concord.org"
      target="_blank" rel="noreferrer">the Concord Consortium.
                                                                                                   </a> This <a
      href="https://concord.org/our-work/research-projects/geohazard/" target="_blank" rel="noreferrer">GeoHazard
                                                                                                             </a> interactive
      was developed under <a href="https://nsf.gov/" target="_blank" rel="noreferrer">National Science Foundation</a> grant
      DRL-1812362.
    </p>
    <Copyright />
  </div>
);
