import React from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { Header } from "./header";
import Checkbox from "@material-ui/core/Checkbox";
import streetThumb from "../assets/model2_map_street_thumb.png";
import topoThumb from "../assets/model2_map_topographic_thumb.png";
import permeabilityThumb from "../assets/model2_map_permeability_thumb.png";
import flatImg from "../assets/map_topographic_key_flat_terrain_4x.png";
import hillyImg from "../assets/map_topographic_key_hilly_terrain_4x.png";
import ViewIcon from "../assets/view_icon.svg";
import { log } from "@concord-consortium/lara-interactive-api";

import css from "./maps-tab.scss";

type Layer = "street" | "topo" | "permeability";

interface IMapButtonProps {
  title: string;
  background: string;
  layer: Layer;
}

const checkboxStyle = { color: "#32a447" };

export const Legend = ({ layer }: { layer: Layer }) => {
  if (layer === "permeability") {
    return (
      <div className={`${css.legend} ${css.permeability}`}>
        <h5>Key</h5>
        <div><div className={`${css.circle} ${css.green}`} /> High (rural)</div>
        <div><div className={`${css.circle} ${css.yellow}`} /> Medium (suburban)</div>
        <div><div className={`${css.circle} ${css.orange}`} /> Low (urban)</div>
        <hr />
      </div>
    );
  }
  if (layer === "topo") {
    return (
      <div className={css.legend}>
        <h5>Key</h5>
        <div><div className={css.rect} style={{ backgroundImage: `url("${flatImg}")` }} /> Flat terrain</div>
        <div><div className={css.rect} style={{ backgroundImage: `url("${hillyImg}")` }} /> Hilly terrain</div>
        <div className={css.comment}>Note: darker shaded areas are steeper</div>
        <hr />
      </div>
    );
  }
  return null;
};

export const MapButton: React.FC<IMapButtonProps> = observer(({ title, background, layer }) => {
  const { ui } = useStores();

  const active = ui.mainLayer === layer;
  const handleClick = () => {
    if (ui.mainLayer !== layer) {
      ui.setMainLayer(layer);
      log("MapLayerChanged", { value: layer });
    }
  };

  const handleTogglePlacesLayer = () => {
    ui.togglePlacesLayer();
    if (ui.placesLayerEnabled) {
      log("PlacesLayerShow");
    } else {
      log("PlacesLayerHidden");
    }
  };

  const handleTogglePoiLayer = () => {
    ui.togglePoiLayer();
    if (ui.poiLayerEnabled) {
      log("POILayerShown");
    } else {
      log("POILayerHidden");
    }
  };

  return (
    <div className={css.mapButton + (active ? ` ${css.active}` : "")} onClick={handleClick}>
      { active && <ViewIcon className={css.viewIcon} /> }
      <div className={css.background} style={{ background: `url("${background}")` }} />
      <div className={css.title}>{ title }</div>
      {
        active &&
        <div>
          <Legend layer={layer} />
          <div className={css.checkboxes}>
            <h5>Labels</h5>
            <div><Checkbox style={checkboxStyle} checked={ui.placesLayerEnabled} onChange={handleTogglePlacesLayer}/> Places</div>
            <div><Checkbox style={checkboxStyle} checked={ui.poiLayerEnabled} onChange={handleTogglePoiLayer} /> Points of interest</div>
          </div>
        </div>
      }
    </div>
  );
});

export const MapsTab: React.FC = observer(() => {
  const { simulation } = useStores();
  const config = simulation.config;

  return (
    <div>
      <Header>Maps</Header>
      <div className={css.mapButtons}>
        { config.streetTexture && <MapButton title={"Street"} background={streetThumb} layer="street"/> }
        { config.topoTexture && <MapButton title={"Topographic"} background={topoThumb} layer="topo" /> }
        { config.permeabilityTexture &&  <MapButton title={"Permeability"} background={permeabilityThumb} layer="permeability" /> }
      </div>
    </div>
  );
});
