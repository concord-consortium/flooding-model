import { useContext, createContext } from "react";
import { createStores, IStores } from "./models/stores";

export const storesContext = createContext<IStores>(createStores());

export const useStores = () => useContext(storesContext)
