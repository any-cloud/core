const delegateToPlugin = (name) => {
  const handler = require(`${process.cwd()}/node_modules/${currentPlugin}/scripts/http`)
    .default.handler;
  return handler(argv);
};

export const queue = delegateToPlugin("queue");
