import React, { ChangeEvent } from "react";
import MuiSlider, { SliderProps } from "@material-ui/core/Slider";
import VerticalHandle from "./assets/slider-thumb-vertical.svg";

// For some reason SliderProps define onChange in a strange way (event: FormEvent).
// It does not happen when SliderProps aren't used explicitly. Fix that by redeclaring onChange type.
interface IProps extends Omit<SliderProps, "onChange"> {
  onChange: (event: ChangeEvent, value: number) => void;
}

export const Slider: React.FC<IProps> = (props) => {
  return (
    <div style={{padding: "0 10px 0 10px"}}>
      <MuiSlider {...props} ThumbComponent={VerticalHandle} track={false} />
    </div>
  );
};
