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
  let updated = new Set();
  const TO_BE_REMOVED = { desc: "this object will be removed" };
  const { get, getAll, set, remove } = pluginDatabase;
  return {
    key,
    unwrapKey,
    get: async key => {
      const keyString = unwrapKey(key);
      batchCache[keyString] = batchCache[keyString] || get(key);
      if (batchCache[keyString] === TO_BE_REMOVED) return;
      return { ...(await batchCache[keyString]) };
    },
    getAll: getAll,
    set: (aKey, value) => {
      const keyString = unwrapKey(aKey);
      batchCache[keyString] = Promise.resolve(value);
      updated.add(keyString);
      return Promise.resolve(true);
    },
    remove: aKey => {
      const keyString = unwrapKey(aKey);
      batchCache[keyString] = TO_BE_REMOVED;
      updated.add(keyString);
      return Promise.resolve(true);
    },
    reset: () => console.error("tried to reset database inside a batch"),
    commit: () => {
      console.log("commiting database batch");
      return Promise.all(
        Array.from(updated).map(async keyString => {
          const result = await batchCache[keyString];
          const aKey = key(keyString);
          if (result === TO_BE_REMOVED) remove(aKey);
          return set(aKey, result);
        })
      );
    }
  };
};

export default {
  key,
  unwrapKey,
  batch,
  ...pluginDatabase
};
