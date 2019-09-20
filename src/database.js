import { requirePluginLib } from "./utils";

const { keySep, ...pluginDatabase } = requirePluginLib("database");

const ENCAPSULATION_CHECK = "asasdfl9kjdfsgid";

const unwrapKey = aKey => {
  const encapsulationErrorMessage = "key needs to be built with key util";
  if (!aKey) {
    throw new Error("tried to use database with empty key");
  }
  if (typeof aKey === "string") {
    throw new Error(encapsulationErrorMessage);
  }
  const { key, encapsulation } = aKey;
  if (!encapsulation || encapsulation !== ENCAPSULATION_CHECK) {
    throw new Error(encapsulationErrorMessage);
  }
  return key;
};

const key = (...keyParts) => {
  let parts = [];
  keyParts.forEach(k => {
    if (!k) {
      throw new Error("tried to use database with empty key");
    }
    parts = [...parts, ...k.split(keySep)];
  });
  const result = parts.join(keySep);
  return { key: result, parts, encapsulation: ENCAPSULATION_CHECK };
};

const batch = () => {
  let batchCache = {};
  let getAllCache = {};
  let updated = new Set();
  const TO_BE_REMOVED = { desc: "this object will be removed" };
  const { get, getAllKeys, getAll, set, remove } = pluginDatabase;
  const batchResponse = {
    key,
    unwrapKey,
    get: async (key, opts) => {
      const keyString = unwrapKey(key);
      batchCache[keyString] = batchCache[keyString] || get(key, opts);
      if (batchCache[keyString] === TO_BE_REMOVED) return;
      const result = await batchCache[keyString];
      if (typeof result === "object") {
        return { ...result };
      }
      if (result && Array.isArray(result)) {
        return [...result];
      }
      return result;
    },
    getAllKeys,
    getAll: async partialKey => {
      const keyString = unwrapKey(partialKey);
      if (!getAllCache[keyString]) {
        getAllCache[keyString] = await getAllKeys(partialKey);
        await Promise.all(
          getAllCache[keyString].map(k => batchResponse.get(k))
        );
      }
      const results = await Promise.all(
        Object.keys(batchCache)
          .filter(k => k.indexOf(keyString) === 0)
          .map(k => batchResponse.get(key(...k.split(keySep))))
      );
      return results.filter(x => x !== undefined);
    },
    set: (aKey, value) => {
      const keyString = unwrapKey(aKey);
      batchCache[keyString] = Promise.resolve(value);
      updated.add(keyString);
      return Promise.resolve(true);
    },
    remove: aKey => {
      const keyString = unwrapKey(aKey);
      if (batchCache[keyString] === TO_BE_REMOVED)
        return Promise.resolve(false);
      batchCache[keyString] = TO_BE_REMOVED;
      updated.add(keyString);
      return Promise.resolve(true);
    },
    reset: () => console.error("tried to reset database inside a batch"),
    commit: async () => {
      const result = await Promise.all(
        Array.from(updated).map(async keyString => {
          const result = await batchCache[keyString];
          const aKey = key(keyString);
          if (result === TO_BE_REMOVED) return remove(aKey);
          return set(aKey, result);
        })
      );
      updated.clear();
      return result;
    }
  };
  return batchResponse;
};

export const commit = () =>
  console.warn("tried to commit without batch (nothing to do)");

export default {
  key,
  unwrapKey,
  batch,
  commit,
  ...pluginDatabase
};
