import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "mobx-react";
import { configure } from "mobx";
import { AppComponent } from "./components/app";
import { MuiThemeProvider } from "@material-ui/core/styles";
import geohazardTheme from "./geohazard-components/geohazard-mui-theme";
import { MeshLineMaterial, MeshLineGeometry } from "meshline";
import { createStores } from "./models/stores";
import { Object3DNode, MaterialNode } from "@react-three/fiber";

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: Object3DNode<MeshLineGeometry, typeof MeshLineGeometry>
    meshLineMaterial: MaterialNode<MeshLineMaterial, typeof MeshLineMaterial>
  }
}

// Disable mobx strict mode. Make v6 compatible with v4/v5 that was not enforcing strict mode by default.
configure({ enforceActions: "never", safeDescriptors: false });

const stores = createStores();

const container = document.getElementById("app");

if (container) {
  const root = createRoot(container);
  root.render(
    <Provider stores={stores}>
      <MuiThemeProvider theme={geohazardTheme}>
        <AppComponent />
      </MuiThemeProvider>
    </Provider>
  );
}
