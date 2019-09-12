import fs from "fs";

export const toPluginName = plugin => `@any-cloud/${plugin}`;

export const currentPlugin = async () => {
  const { get } = configDB();
  return toPluginName(await get("anyCloud.plugin"));
};

export const setCurrentPlugin = plugin => {
  const { set } = configDB();
  return set("anyCloud.plugin", plugin);
};

export const pathToPlugin = pluginName =>
  `${process.cwd()}/node_modules/${pluginName}`;

export const cliHandlerPath = (pathToPlugin, handlerName) =>
  `${pathToPlugin}/lib/cli/${handlerName}`;

export const libPath = (pathToPlugin, libName) =>
  `${pathToPlugin}/lib/include/${libName}`;

export const requirePluginLib = async name => {
  return require(libPath(pathToPlugin(await currentPlugin()), name));
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
