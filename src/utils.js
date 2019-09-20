import fs from "fs";
import path from "path";

export const toPluginName = plugin => `@any-cloud/${plugin}`;

export const isPlugin = name =>
  !["@any-cloud/cli", "@any-cloud/core"].includes(name);

export const defaultPluginFromPackageJson = () => {
  const info = require(path.join(process.cwd(), "package.json"));
  if (info.name.indexOf("@any-cloud") === 0 && isPlugin(info.name)) {
    return info.name;
  }
  const dep = Object.keys(info.dependencies).find(
    name => name.indexOf("@any-cloud") === 0 && isPlugin(name)
  );
  if (dep) return dep;
  const devDep = Object.keys(info.devDependencies).find(
    name => name.indexOf("@any-cloud") === 0 && isPlugin(name)
  );
  if (devDep) return devDep;
};
export const currentPlugin = async () => {
  const configRoot = pathToPlugin(".cache");
  let result;
  if (fs.existsSync(configRoot)) {
    const { get } = configDB();
    result = toPluginName(await get("anyCloud.plugin"));
  }
  result = result || defaultPluginFromPackageJson();
  return result;
};
export const currentPluginSync = () => {
  const configRoot = pathToPlugin(".cache");
  let result;
  if (fs.existsSync(configRoot)) {
    let currentConfig;
    try {
      currentConfig = require(path.join(configRoot, "anyCloud"));
      return toPluginName(currentConfig.plugin);
    } catch {}
  }
  result = result || defaultPluginFromPackageJson();
  return result;
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

export const appDirPath = () => {
  const stagingAppDir = path.join(process.cwd(), "AC_APPLICATION_CODE");
  if (fs.existsSync(stagingAppDir)) {
    return stagingAppDir;
  }
  return process.cwd();
};

export const requireAppLib = name => {
  return require(appDirPath())[name];
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
