// TODO: get currently selected plugin
export const currentPlugin = () => "@any-cloud/local";

export const pathToPlugin = pluginName =>
  `${process.cwd()}/node_modules/${pluginName}`;

export const cliHandlerPath = (pathToPlugin, handlerName) =>
  `${pathToPlugin}/lib/cli/${handlerName}`;

export const libPath = (pathToPlugin, libName) =>
  `${pathToPlugin}/lib/include/${libName}`;

export const requirePluginLib = name => {
  return require(libPath(pathToPlugin(currentPlugin()), name));
};

export const requireCLIHandler = name => {
  return require(cliHandlerPath(pathToPlugin(currentPlugin()), name)).default.handler;
};
