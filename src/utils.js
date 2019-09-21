import fs from "fs";
import path from "path";

export const toPluginName = plugin => `@any-cloud/${plugin}`;

export const isPlugin = name =>
  name.indexOf("@any-cloud") === 0 &&
  !["@any-cloud/cli", "@any-cloud/core"].includes(name);
const packageInfoFromDir = aPath => {
  return require(path.join(aPath, "package.json"));
};
export const chokeUpPath = path =>
  ["node_modules", "AC_APPLICATION_CODE"].reduce(
    (acc, cur) => acc.split(cur)[0],
    path || process.env.ANY_CLOUD_PATH || process.cwd()
  );
const nodeModulePath = (rt, moduleName) =>
  path.join(rt, "node_modules", moduleName);
const configRoot = () => nodeModulePath(chokeUpPath(), ".cache");

export const defaultPluginFromPackageJson = () => {
  const rootPath = chokeUpPath();
  const rootPathPackageName = packageInfoFromDir(rootPath).name;
  if (isPlugin(rootPathPackageName)) {
    return rootPathPackageName;
  }
  const info = packageInfoFromDir(process.cwd());
  if (isPlugin(info.name)) {
    return info.name;
  }
  const dep = Object.keys(info.dependencies || {}).find(name => isPlugin(name));
  if (dep) return dep;
  const devDep = Object.keys(info.devDependencies || {}).find(name =>
    isPlugin(name)
  );
  if (devDep) return devDep;
};
export const currentPluginSync = () => {
  const configRt = configRoot();
  let result;
  if (fs.existsSync(configRt)) {
    let currentConfig;
    try {
      currentConfig = require(path.join(configRt, "anyCloud"));
      result = toPluginName(currentConfig.plugin);
    } catch {}
  }
  result = result || defaultPluginFromPackageJson();
  return result;
};
export const currentPlugin = async () => {
  return currentPluginSync();
};

export const setCurrentPlugin = plugin => {
  const { set } = configDB();
  return set("anyCloud.plugin", plugin);
};

export const pathToPlugin = pluginName => {
  const chokePath = chokeUpPath();
  const cwd = process.cwd();
  return [
    chokePath,
    cwd,
    nodeModulePath(chokePath, pluginName),
    nodeModulePath(cwd, pluginName)
  ].find(p => packageInfoFromDir(p).name === pluginName);
};

export const cliHandlerPath = (pathToPlugin, handlerName) =>
  path.join(pathToPlugin, "lib", "cli", handlerName);

export const libPath = (pathToPlugin, libName) =>
  path.join(pathToPlugin, "lib", "include", libName);

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
  const configRt = configRoot();
  fs.mkdirSync(configRt, { recursive: true });
  return require("json-fs-db")(configRt);
};

export const debugInfo = () => {
  const result = {
    toPluginName: toPluginName("<plugin>"),
    packageInfoFromDir: packageInfoFromDir(process.cwd()),
    chokeUpPath: chokeUpPath(),
    nodeModulePath: nodeModulePath("<root>", "<moduleName>"),
    configRoot: configRoot(),
    defaultPluginFromPackageJson: defaultPluginFromPackageJson(),
    currentPluginSync: currentPluginSync(),
    currentPlugin: currentPlugin(),
    appDirPath: appDirPath(),
    cliHandlerPath: cliHandlerPath("<pathToPlugin>", "<handlerName>"),
    libPath: libPath("<pathToPlugin>", "<libName>"),
    currentPluginCLIHandlerPath: currentPluginCLIHandlerPath("<name>")
  };

  try {
    result.pathToPluginLocal = pathToPlugin("@any-cloud/local");
  } catch (e) {}
  try {
    result.pathToPluginFirebase = pathToPlugin("@any-cloud/firebase");
  } catch (e) {}
  return result;
};

export default {
  chokeUpPath,
  debugInfo,
  toPluginName,
  isPlugin,
  defaultPluginFromPackageJson,
  currentPlugin,
  currentPluginSync,
  setCurrentPlugin,
  pathToPlugin,
  cliHandlerPath,
  libPath,
  requirePluginLib,
  appDirPath,
  requireAppLib,
  currentPluginCLIHandlerPath,
  requireCLIHandler,
  configDB
};
