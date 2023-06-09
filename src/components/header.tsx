import React from "react";
import css from "./header.scss";

interface IProps {
  children?: React.ReactNode
}

export const Header: React.FC<IProps> = ({ children }) => <div className={css.header}>{ children }</div>;
