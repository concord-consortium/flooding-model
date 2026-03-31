import { log as laraLog } from "@concord-consortium/lara-interactive-api";
import { createLogWrapper } from "@concord-consortium/log-monitor";
import { getDefaultConfig, getUrlConfig } from "./config";

const config = Object.assign(getDefaultConfig(), getUrlConfig());

export const log = config.logMonitor
  ? createLogWrapper(laraLog)
  : laraLog;
