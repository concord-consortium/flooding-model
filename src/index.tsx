import { Provider } from "mobx-react";
import React from "react";
import ReactDOM from "react-dom";
import { AppComponent } from "./components/app";
import { MuiThemeProvider } from "@material-ui/core/styles";
import { createStores } from "./models/stores";
import geohazardTheme from "./geohazard-components/geohazard-mui-theme";

const stores = createStores();

ReactDOM.render(
  <Provider stores={stores}>
    <MuiThemeProvider theme={geohazardTheme}>
      <AppComponent />
    </MuiThemeProvider>
  </Provider>,
  document.getElementById("app")
);
