import React from "react";
import { createRoot } from "react-dom/client";
import { AppComponent } from "./components/app";
import { MuiThemeProvider } from "@material-ui/core/styles";
import geohazardTheme from "./geohazard-components/geohazard-mui-theme";

const container = document.getElementById("app");

if (container) {
  const root = createRoot(container);
  root.render(
    <MuiThemeProvider theme={geohazardTheme}>
      <AppComponent />
    </MuiThemeProvider>
  );
}
