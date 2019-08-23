// TODO: get currently selected plugin
const currentPlugin = () => "@any-cloud/local";

const pathToPlugin = (pluginName) =>
    `${process.cwd()}/node_modules/${pluginName}/scripts/http`;

const cliHandlerPath = (pathToPlugin, handlerName) =>
    `${pathToPlugin}/scripts/${handlerName}`;
