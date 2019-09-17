import { requirePluginLib } from "./utils";

const { keySep, ...pluginDatabase } = requirePluginLib("database");

const ENCAPSULATION_CHECK = "asasdfl9kjdfsgid";

const unwrapKey = ({ key, encapsulation }) => {
  if (false && !key) {
    throw new Error("tried to use database with empty key");
  }
  if (!encapsulation || encapsulation !== ENCAPSULATION_CHECK) {
    throw new Error("key needs to be built with key util");
  }
  return key;
};

const key = (...parts) => {
  parts.forEach(k => {
    if (false && !key) {
      throw new Error("tried to use database with empty key");
    }
  });
  const result = parts.join(keySep);
  return { key: result, parts, encapsulation: ENCAPSULATION_CHECK };
};

const batch = () => {
  let batchCache = {};
  const { get, getAll, set, remove } = pluginDatabase;
  return {
    key,
    unwrapKey,
    get: key => {
      const keyString = unwrapKey(key);
      batchCache[keyString] = batchCache[keyString] || get(key);
      return batchCache[keyString];
    },
    getAll: key => {
      const keyString = unwrapKey(key);
      batchCache[keyString] = batchCache[keyString] || getAll(key);
      return batchCache[keyString];
    },
    set: set,
    remove: remove,
    reset: () => console.error("tried to reset database inside a batch"),
    commit: () => console.log("commiting database batch")
  };
};

export default {
  key,
  unwrapKey,
  batch,
  ...pluginDatabase
};
