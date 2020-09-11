import { createMuiTheme } from "@material-ui/core/styles";

export default createMuiTheme({
  palette: {
    primary: {
      main: "#aaa"
    },
    secondary: {
      main: "#ff9900"
    }
  },
  shape: {
    borderRadius: 9
  },
  typography: {
    fontFamily: "Lato, Arial, sans-serif",
    button: {
      textTransform: "none",
      fontSize: "14px",
      fontWeight: "bold"
    }
  },
  overrides: {
    MuiButton: {
      root: {
        "&:hover": {
          backgroundColor: "#dfdfdf",
        },
        "&$disabled": {
          color: "inherit",
          filter: "grayscale(1)",
          opacity: 0.25
        }
      },
      text: {
        color: "#434343",
        padding: 0,
      }
    },
    MuiCheckbox: {
      root: {
        padding: 2
      }
    },
    MuiSwitch: {
      root: {
        padding: 14
      },
      thumb: {
        "width": 18,
        "height": 18,
        "boxShadow": "0 1px 5px 0 rgba(0, 0, 0, 0.35)",
        "border": "1px solid #797979",
        "$switchBase:hover &": {
          boxShadow: "0 0 0 3px rgba(255, 255, 255, 0.5)",
        },
        "$switchBase:active &": {
          boxShadow: "0 0 0 3px rgba(255, 255, 255, 1)",
        }
      },
      switchBase: {
        backgroundColor: "transparent !important" // disable default hover state
      },
      track: {
        "backgroundColor": "#797979",
        "opacity": 1,
        "$switchBase$checked + &": {
          opacity: 1
        }
      }
    },
    MuiSlider: {
      thumb: {
        height: 20,
        width: 20,
        backgroundColor: "#fff",
        marginTop: -9,
        marginLeft: -10,
        "&:hover, &$active": {
          boxShadow: "0 0 0 4px rgba(255,255,255,0.5)"
        }
      },
      active: {},
      mark: {
        width: 4,
        height: 4,
        borderRadius: 3,
        marginTop: -2,
        backgroundColor: "#d8d8d8",
        border: "1px solid #797979"
      },
      rail: {
        height: 2,
        backgroundColor: "#000"
      },
      markLabel: {
        fontFamily: "Roboto Condensed",
        fontSize: "10px",
        marginLeft: "1px"
      }
    }
  }
});
