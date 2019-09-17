import * as allUtils from "./utils";
import db from "./database";

const { requirePluginLib, requireAppLib } = allUtils;

export const queue = requirePluginLib("queue");

export const init = requireAppLib("init");
export const cron = requireAppLib("cron");
export const worker = requireAppLib("worker");

export const http = () => {
  const { http: pluginHttp } = requirePluginLib("http");
  const appHttp = requireAppLib("http");
  return appHttp(pluginHttp);
};

export const database = db;

export const utils = allUtils;
