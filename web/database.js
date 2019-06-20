'use strict';

function Database(dbName) {

  if (!dbName) {
    dbName = 'test';
  }

  let db;
  let onEvent;

  const onEventHandler = (cb) => {
    onEvent = cb;
  };

  const eventHandler = (e) => {
    if (onEvent && typeof onEvent === 'function') {
      onEvent(e);
    }
  };

  const Fail = (err, reject) => {
    reject({
      "code": 400,
      "message": err.message || err.toString() || "Error!"
    });
  };

  const open = async () => {
    return new Promise((resolve, reject) => {
      if (db) {
        return resolve(db);
      }
      let open = indexedDB.open(dbName, 1);
      open.onerror = (e) => {
        Fail(e, reject);
      };
      open.onupgradeneeded = (e) => {
        db = e.target.result;
        let store = db.createObjectStore(dbName, {
          "keyPath": "key"
        });
      };
      open.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
    });
  };

  const close = async () => {
    return new Promise((resolve, reject) => {
      if (db) {
        db.close();
        db = null;
        resolve(true);
      } else {
        resolve(true);
      }
    });
  };

  const txStore = async (method, fail) => {
    if (!db) {
      await open();
    }
    let tx = db.transaction([dbName], method);
    tx.onerror = (e) => {
      Fail(e, reject);
    };
    let store = tx.objectStore(dbName);
    return store;
  };

  const put = (key, value) => {
    return new Promise(async (resolve, reject) => {
      let store = await txStore('readwrite', reject);
      let req = store.put({
        "key": key,
        "value": value
      });
      req.onsuccess = (event) => {
        let e = {
          "event": "write",
          "key": key,
          "timestamp": Date.now()
        };
        eventHandler(e);
        resolve(e);
      };
      req.onerror = req.onblocked = (err) => {
        Fail(e, reject);
      };
    });
  };

  const get = (key) => {
    return new Promise(async (resolve, reject) => {
      let store = await txStore('readonly', reject);
      let req = store.get(key);
      req.onsuccess = (e) => {
        resolve(req.result || {
          "key": key,
          "value": null
        });
      };
      req.onerror = req.onblocked = (err) => {
        Fail(e, reject);
      };
    });
  };

  const del = (keys = []) => {
    return new Promise(async (resolve, reject) => {
      let store = await txStore('readwrite', reject);

      let keyPaths = [];
      if (!keys) {
        return reject({
          "code": 400,
          "message": "A key or an array of keys is required."
        });
      }
      if (typeof keys === 'string') {
        keyPaths = [keys];
      } else {
        keyPaths = keys;
      }
      let ops = [];
      keyPaths.forEach(path => {
        ops.push({
          "type": "del",
          "key": path
        });
      });

      for (let i = 0; i < keyPaths.length; i++) {
        let req = store.delete(keyPaths[i]);
      }
      store.transaction.oncomplete = () => {
        let e = {
          "db": dbName,
          "event": "delete",
          "keys": keyPaths,
          "timestamp": Date.now()
        };
        eventHandler(e);
        resolve(e);
      };
      store.transaction.onerror = (err) => {
        db.close();
        reject(err);
      };
    });
  };

  const list = (query) => {
    return new Promise(async (resolve, reject) => {
      let store = await txStore('readonly', reject);
      if (!query || typeof query !== 'object') {
        query = {};
      }
      let results = [];
      let gt = query.gt || '\u0000';
      let lt = query.lt || '\uffff';
      let limit;
      if (query.limit) {
        limit = parseInt(query.limit);
      }
      let reverse = "next";
      if (query.reverse) {
        reverse = "prev";
      }
      let req = store.openCursor(IDBKeyRange.bound(gt, lt, true, true), reverse);
      req.onsuccess = () => {
        let cursor = req.result;
        if ((!limit && cursor) || (results.length < limit && cursor)) {
          let result = {};
          if (query.values) {
            result = cursor.value;
          } else {
            result = cursor.primaryKey;
          }
          results.push(result);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = req.onblocked = (err) => {
        reject({
          "code": 400,
          "message": "Error deleting database. " + err.toString()
        });
      };
    });
  };

  const deleteDB = () => {
    return new Promise(async (resolve, reject) => {
      let closed = await close();
      let req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => {
        let e = {
          "db": dbName,
          "event": "deleteDB",
          "timestamp": Date.now()
        };
        eventHandler(e);
        resolve(e);
      };
      req.onerror = (err) => {
        reject({
          "code": 400,
          "message": "Error deleting database. " + err.toString()
        });
      };
    });
  };

  const exportDB = async () => {
    let results = await list({
      "values": true
    });

    return results;
  };

  const importDB = (items = []) => {
    return new Promise(async (resolve, reject) => {
      let store = await txStore('readwrite', reject);
      for (let x = 0; x < items.length; x++) {
        let req = store.put(items[x]);
      }
      store.transaction.oncomplete = () => {
        let e = {
          "db": dbName,
          "event": "importDB",
          "keys": items.map(val => {
            return val.key;
          }),
          "timestamp": Date.now()
        };
        eventHandler(e);
        resolve(e);
      };
      store.onerror = (err) => {
        reject({
          "code": 400,
          "message": "Error importing database. " + err.toString()
        });
      };

    });

  };

  return {
    put,
    get,
    del,
    list,
    deleteDB,
    exportDB,
    importDB,
    "onEvent": onEventHandler,
    close
  };

}

