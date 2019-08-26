import * as allUtils from "./utils";

const { requirePluginLib } = allUtils;

export const queue = requirePluginLib("queue");

export const database = requirePluginLib("database");

export const utils = allUtils;
