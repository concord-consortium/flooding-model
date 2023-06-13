import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import { Header } from "./header";
import { TimePeriod } from "../config";
import { getSilverCityPreset } from "../presets";
import { clsx } from "clsx";
import Checkbox from "@material-ui/core/Checkbox";
import { log } from "@concord-consortium/lara-interactive-api";
import streetThumb from "../assets/model2_map_street_thumb.png";
import topoThumb from "../assets/model2_map_topographic_thumb.png";
import permeabilityThumb from "../assets/model2_map_permeability_thumb.png";
import presentTopoThumb from "../assets/map_present_topographic_thumb.png";
import presentStreetThumb from "../assets/map_present_street_thumb.png";
import presentPermeabilityThumb from "../assets/map_present_permeability_thumb.png";
import pastTopoThumb from "../assets/map_past_topographic_thumb.png";
import pastStreetThumb from "../assets/map_past_street_thumb.png";
import pastPermeabilityThumb from "../assets/map_past_permeability_thumb.png";
import futureTopoThumb from "../assets/map_future_topographic_thumb.png";
import futureStreetThumb from "../assets/map_future_street_thumb.png";
import futurePermeabilityThumb from "../assets/map_future_permeability_thumb.png";
import flatImg from "../assets/map_topographic_key_flat_terrain_4x.png";
import hillyImg from "../assets/map_topographic_key_hilly_terrain_4x.png";
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

const timePeriodThumbImage: Record<TimePeriod, Record<Layer, string>> = {
  present: {
    street: presentStreetThumb,
    topo: presentTopoThumb,
    permeability: presentPermeabilityThumb
  },
  past: {
    street: pastStreetThumb,
    topo: pastTopoThumb,
    permeability: pastPermeabilityThumb
  },
  future: {
    street: futureStreetThumb,
    topo: futureTopoThumb,
    permeability: futurePermeabilityThumb
  }
};

interface ITimePeriodButtonProps {
  title: string;
  background: string;
  preset: TimePeriod;
}

export const TimePeriodButton: React.FC<ITimePeriodButtonProps> = observer(({ title, background, preset }) => {
  const { simulation, ui } = useStores();

  const handleClick = () => {
    const presetConfig = getSilverCityPreset(preset);
    simulation.load(presetConfig);
    ui.resetInteraction(); // user could be in levees mode and it's not allowed in the past preset / mode
    log("TimePeriodChanged", { value: preset });
  };

  const active = simulation.config.timePeriod === preset;
  const disabled = !simulation.dataReady || simulation.simulationStarted;

  return (
    <div className={clsx(css.mapButton, {[css.active]: active, [css.disabled]: disabled })} onClick={!active && !disabled ? handleClick : undefined}>
      { active && <ViewIcon className={css.viewIcon} /> }
      <div className={css.background} style={{ background: `url("${background}")` }} />
      <div className={css.title}>{ title }</div>
    </div>
  );
});

export const MapsTab: React.FC = observer(() => {
  const { simulation, ui } = useStores();
  const config = simulation.config;

  return (
    <div className={css.content}>
      <Header>Maps</Header>
      <div className={css.content}>
        <div className={css.mapButtons}>
          { config.streetTexture && <MapButton title={"Street"} background={streetThumb} layer="street"/> }
          { config.topoTexture && <MapButton title={"Topographic"} background={topoThumb} layer="topo" /> }
          { config.permeabilityTexture &&  <MapButton title={"Permeability"} background={permeabilityThumb} layer="permeability" /> }
        </div>
        {
          config.timePeriodButtons &&
          <div className={css.timePeriodButtons}>
            <hr />
            <Header>Time Period</Header>
            <div className={css.note}><b>Note:</b> The Time Period cannot be changed once a simulation has started.</div>
            <div className={css.mapButtons}>
              <TimePeriodButton title={"Past"} background={timePeriodThumbImage.past[ui.mainLayer]} preset="past"/>
              <TimePeriodButton title={"Present"} background={timePeriodThumbImage.present[ui.mainLayer]} preset="present" />
              <TimePeriodButton title={"Future"} background={timePeriodThumbImage.future[ui.mainLayer]} preset="future" />
            </div>
          </div>
        }
      </div>
    </div>
  );
});
