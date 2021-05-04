import React from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../use-stores";
import { Header } from "./header";
import Checkbox from "@material-ui/core/Checkbox";
import streetThumb from "../assets/model2_map_street_thumb.png";
import topoThumb from "../assets/model2_map_topographic_thumb.png";
import permeabilityThumb from "../assets/model2_map_permeability_thumb.png";
import ViewIcon from "../assets/view_icon.svg";
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
      <div className={css.legend}>
        <h5>Key</h5>
        <div><div className={`${css.circle} ${css.green}`} /> High (rural)</div>
        <div><div className={`${css.circle} ${css.yellow}`} /> Medium (suburban)</div>
        <div><div className={`${css.circle} ${css.orange}`} /> Low (urban)</div>
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
    ui.setMainLayer(layer);
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
            <div><Checkbox style={checkboxStyle} checked={ui.placesLayerEnabled} onChange={ui.togglePlacesLayer}/> Places</div>
            <div><Checkbox style={checkboxStyle} checked={ui.poiLayerEnabled} onChange={ui.togglePoiLayer} /> Points of interest</div>
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
