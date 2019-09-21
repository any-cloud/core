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

export { default as database } from "./database";

export { default as utils } from "./utils";
