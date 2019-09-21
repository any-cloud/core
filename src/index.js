import db from "./database";
import { requirePluginLib, requireAppLib } from "./utils";

export const queue = requirePluginLib("queue");

export const init = requireAppLib("init");
export const cron = requireAppLib("cron");
export const workers = requireAppLib("workers");

export const http = () => {
  const { http: pluginHttp } = requirePluginLib("http");
  const appHttp = requireAppLib("http");
  return appHttp(pluginHttp);
};

export const database = db;

export { default as utils } from "./utils";
