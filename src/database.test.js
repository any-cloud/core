import { database, utils } from "@any-cloud/core";
const { keySep } = utils.requirePluginLib("database");

let basicSuite;
const emptyKeyError = new Error("tried to use database with empty key");
const encapsulationError = new Error("key needs to be built with key util");
describe("database", () => {
  beforeEach(() => {
    console.error = jest.fn();
    console.trace = jest.fn();
  });
  describe(
    "basics",
    (basicSuite = db => () => {
      const { key, unwrapKey, get, set, remove, getAll } = db;
      describe("key", () => {
        it("enforces usage with unwrapKey", () => {
          expect(() => unwrapKey(undefined)).toThrow(emptyKeyError);
          expect(() => unwrapKey(null)).toThrow(emptyKeyError);
          expect(() => unwrapKey({})).toThrow(encapsulationError);
          expect(() => unwrapKey("some string")).toThrow(encapsulationError);
          expect(() =>
            unwrapKey({ key: "some string key", encapsulation: "fake" })
          ).toThrow(encapsulationError);
        });
        it("wraps and unwraps a key", () => {
          expect(
            key(unwrapKey(key(unwrapKey(key("a", "b", "c"))))).parts
          ).toEqual(["a", "b", "c"]);
          expect(typeof unwrapKey(key("1", "2"))).toEqual("string");
        });
      });
      describe("get and set", () => {
        it("takes a key and returns a promise that resolves the value", async () => {
          await Promise.all([
            remove(key("test", "a")),
            remove(key("test", "b"))
          ]);
          await Promise.all([
            set(key("test", "a"), "basic"),
            set(key("test", "b"), 6)
          ]);
          expect(
            await Promise.all([get(key("test", "a")), get(key("test", "b"))])
          ).toEqual(["basic", 6]);
        });
        it("prints an error if the key does not exist", async () => {
          expect(await get(key("test", "oops"))).toBe(undefined);
          expect(console.error).toHaveBeenCalled();
          expect(console.trace).toHaveBeenCalled();
        });
        it("only accepts wrapped keys", async () => {
          await set(key("test", "c"), "blah");
          await expect(get(`test${keySep}c`)).rejects.toEqual(
            encapsulationError
          );
        });
        it("set returns a promise that resolves to a boolean", async () => {
          await remove(key("test", "e"));
          expect(await set(key("test", "e"), "k")).toBe(true);
        });
        it("properly serializes and deserializes values", async () => {
          const number = 32.4;
          const string = "a string";
          const boolean = false;
          const object = { number, string, boolean };
          await Promise.all([
            set(key("test", "d", "num"), number),
            set(key("test", "d", "str"), string),
            set(key("test", "d", "bool"), boolean),
            set(key("test", "d", "obj"), object)
          ]);
          await expect(
            Promise.all([
              get(key("test", "d", "num")),
              get(key("test", "d", "str")),
              get(key("test", "d", "bool")),
              get(key("test", "d", "obj"))
            ])
          ).resolves.toEqual([number, string, boolean, object]);
        });
      });
      describe("remove", () => {
        it("takes a key and removes it from the database", async () => {
          await set(key("test", "e", "removeThis"), "something here");
          expect(await get(key("test", "e", "removeThis"))).toEqual(
            "something here"
          );
          await remove(key("test", "e", "removeThis"));
          expect(await get(key("test", "e", "removeThis"))).toBe(undefined);
        });
        it("returns a promise that resolves to a boolean", async () => {
          await set(key("test", "e", "removeThisToo"), "something here");
          expect(await remove(key("test", "e", "removeThisToo"))).toBe(true);
          expect(await remove(key("test", "e", "removeThisToo"))).toBe(false);
        });
      });
      describe("getAll", () => {
        it("takes a partial key and returns everything in that namespace", async () => {
          await Promise.all([
            set(key("test", "f", "one"), "fish"),
            set(key("test", "f", "two"), "FISH"),
            set(key("test", "f", "red"), "FiSh"),
            set(key("test", "f", "blue"), "fiSH")
          ]);
          const result = await getAll(key("test", "f"));
          expect(result.sort()).toEqual(["FISH", "FiSh", "fiSH", "fish"]);
        });
        it("only accepts wrapped keys", async () => {
          await expect(getAll("test")).rejects.toEqual(encapsulationError);
        });
        it("properly deserializes values", async () => {
          const number = 32.4;
          const string = "a string";
          const boolean = false;
          const object = { number, string, boolean };
          await Promise.all([
            set(key("test", "g", "num"), number),
            set(key("test", "g", "str"), string),
            set(key("test", "g", "bool"), boolean),
            set(key("test", "g", "obj"), object)
          ]);
          expect((await getAll(key("test", "d"))).sort()).toEqual([
            number,
            object,
            string,
            boolean
          ]);
        });
      });
    })(database)
  );
  describe("batch", () => {
    let db;
    beforeEach(() => {
      db = database.batch();
    });
    describe("basics", basicSuite(database.batch()));
    describe("commit", () => {
      it("saves the latest values of everything", async () => {
        const { set, get, key } = db;
        await database.remove(key("test", "batch", "a"));
        await set(key("test", "batch", "a"), "set in batch");
        expect(await get(key("test", "batch", "a"))).toEqual("set in batch");
        expect(await database.get(key("test", "batch", "a"))).toEqual(
          undefined
        );
        await set(key("test", "batch", "a"), "set again in batch");
        expect(await get(key("test", "batch", "a"))).toEqual(
          "set again in batch"
        );
        expect(await database.get(key("test", "batch", "a"))).toEqual(
          undefined
        );
        await db.commit();
        expect(await get(key("test", "batch", "a"))).toEqual(
          "set again in batch"
        );
        expect(await database.get(key("test", "batch", "a"))).toEqual(
          "set again in batch"
        );
      });
      it("removes things that were removed", async () => {
        const { remove, get, key } = db;
        await database.set(key("test", "batch", "removeMe"), "something");
        expect(
          await get(key("test", "batch", "removeMe"), "something")
        ).toEqual("something");
        await remove(key("test", "batch", "removeMe"));
        expect(await get(key("test", "batch", "removeMe"), "something")).toBe(
          undefined
        );
        expect(
          await database.get(key("test", "batch", "removeMe"), "something")
        ).toEqual("something");
        await db.commit();
        expect(
          await database.get(key("test", "batch", "removeMe"), "something")
        ).toBe(undefined);
      });
      it("resets batch save states", async () => {
        const { remove, set, get, key } = db;
        await Promise.all([
          set(key("test", "batch", "noDoubleSave"), "asdf"),
          database.set(key("test", "batch", "noDoubleRemove", "ghjkl"))
        ]);
        await remove(key("test", "batch", "noDoubleRemove"));
        await db.commit();
        expect(
          await Promise.all([
            database.get(key("test", "batch", "noDoubleSave")),
            database.get(key("test", "batch", "noDoubleRemove"))
          ])
        ).toEqual(["asdf", undefined]);
        await Promise.all([
          database.set(key("test", "batch", "noDoubleSave"), "something new"),
          database.set(key("test", "batch", "noDoubleRemove"), "I am back")
        ]);
        await db.commit();
        expect(
          await Promise.all([
            database.get(key("test", "batch", "noDoubleSave")),
            database.get(key("test", "batch", "noDoubleRemove")),
            get(key("test", "batch", "noDoubleSave")),
            get(key("test", "batch", "noDoubleRemove"))
          ])
        ).toEqual(["something new", "I am back", "asdf", undefined]);
      });
    });
  });
});
