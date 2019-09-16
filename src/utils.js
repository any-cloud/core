import fs from "fs";
import path from "path";

export const toPluginName = plugin => `@any-cloud/${plugin}`;

export const defaultPluginFromPackageJson = () => {
  const info = require(path.join(process.cwd(), "package.json"));
  if (info.name.indexOf("@any-cloud") === 0) {
    return info.name;
  }
  return Object.keys(info.dependencies).find(
    name =>
      name.indexOf("@any-cloud") === 0 &&
      !["@any-cloud/cli", "@any-cloud/core"].includes(name)
  );
};
export const currentPlugin = async () => {
  const configRoot = pathToPlugin(".cache");
  if (fs.existsSync(configRoot)) {
    const { get } = configDB();
    return toPluginName(await get("anyCloud.plugin"));
  }
  return defaultPluginFromPackageJson();
};
export const currentPluginSync = () => {
  const configRoot = pathToPlugin(".cache");
  if (fs.existsSync(configRoot)) {
    let currentConfig;
    try {
      currentConfig = require(path.join(configRoot, "anyCloud"));
      return toPluginName(currentConfig.plugin);
    } catch {}
  }
  return defaultPluginFromPackageJson();
};

export const setCurrentPlugin = plugin => {
  const { set } = configDB();
  return set("anyCloud.plugin", plugin);
};

export const pathToPlugin = pluginName => {
  if (process.cwd().includes("AC_APPLICATION_CODE")) {
    return process.cwd().split("AC_APPLICATION_CODE")[0];
  }
  if (fs.existsSync(path.join(process.cwd(), "AC_APPLICATION_CODE"))) {
    return process.cwd();
  }
  return `${process.cwd()}/node_modules/${pluginName}`;
};

export const cliHandlerPath = (pathToPlugin, handlerName) =>
  `${pathToPlugin}/lib/cli/${handlerName}`;

export const libPath = (pathToPlugin, libName) =>
  `${pathToPlugin}/lib/include/${libName}`;

export const requirePluginLib = name => {
  return require(libPath(pathToPlugin(currentPluginSync()), name));
};

export const currentPluginCLIHandlerPath = (name = "") => {
  return cliHandlerPath(pathToPlugin(currentPluginSync()), name);
};

export const requireCLIHandler = async name => {
  return require(cliHandlerPath(pathToPlugin(await currentPlugin()), name))
    .default.handler;
};

export const configDB = () => {
  const configRoot = pathToPlugin(".cache");
  fs.mkdirSync(configRoot, { recursive: true });
  return require("json-fs-db")(configRoot);
};
