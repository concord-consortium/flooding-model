import React from "react";
import ReactDOM from "react-dom";
import { AppComponent } from "./components/app";
import { MuiThemeProvider } from "@material-ui/core/styles";
import geohazardTheme from "./geohazard-components/geohazard-mui-theme";
// See: https://github.com/mobxjs/mobx-react-lite#observer-batching
import "mobx-react-lite/batchingForReactDom";

ReactDOM.render(
  <MuiThemeProvider theme={geohazardTheme}>
    <AppComponent />
  </MuiThemeProvider>,
  document.getElementById("app")
);
