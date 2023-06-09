import React from "react";
import css from "./header.scss";

export const Header: React.FC = ({ children }: { children?: React.ReactNode }) => <div className={css.header}>{ children }</div>;
