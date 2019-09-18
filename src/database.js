import { requirePluginLib } from "./utils";

const { keySep, ...pluginDatabase } = requirePluginLib("database");

const ENCAPSULATION_CHECK = "asasdfl9kjdfsgid";

const isKey = ({ key, encapsulation }) => {
  if (!key) {
    return false;
  }
  if (!encapsulation || encapsulation !== ENCAPSULATION_CHECK) {
    return false;
  }
  return true;
};

const unwrapKey = ({ key, encapsulation }) => {
  if (!key) {
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
  const batchResponse = {
    key,
    unwrapKey,
    get: async key => {
      const keyString = unwrapKey(key);
      batchCache[keyString] = batchCache[keyString] || get(key);
      if (batchCache[keyString] === TO_BE_REMOVED) return;
      return { ...(await batchCache[keyString]) };
    },
    getAll: async partialKey => {
      const keyString = unwrapKey(partialKey);
      batchCache[keyString] =
        batchCache[keyString] || (await getAll(partialKey));
      return Promise.all(
        Object.keys(batchCache)
          .filter(k => k.indexOf(keyString) === 0)
          .map(k => batchResponse.get(key(k)))
      );
    },
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
  return batchResponse;
};

export default {
  key,
  unwrapKey,
  batch,
  ...pluginDatabase
};
