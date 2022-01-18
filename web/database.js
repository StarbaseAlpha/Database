'use strict';

function Database(dbName) {


  if (typeof window !== 'undefined' && typeof window === 'object') {
    if (!window.indexedDB) {
      window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    }

    if (!window.IDBTransaction) {
      window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {
        READ_WRITE: "readwrite"
      };
    }

    if (!window.IDBKeyRange) {
      window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    }
  }

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

  const close = async () => {
    if (db) {
      db.close();
      db = null;
    }
    return true;
  };

  const open = async () => {
    return new Promise((resolve, reject) => {
      if (db) {
        return resolve(db);
      }
      let open = indexedDB.open(dbName, 1);
      open.onerror = (e) => {
        reject({
          "code": 400,
          "message": err.message || err.toString() || "Error!"
        });
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

  const put = (key, value) => {
    return new Promise(async (resolve, reject) => {
      if (!db) {
        await open();
      }
      let store = db.transaction([dbName], 'readwrite').objectStore(dbName);
      let req = store.put({
        value,
        key
      });
      req.onsuccess = () => {
        let e = {
          "db": dbName,
          "event": "write",
          "key": key,
          "timestamp": Date.now()
        };
        eventHandler(e);
        resolve(e);
      };
      req.onerror = req.onblocked = (err) => {
        reject({
          "code": 400,
          "message": err.message || err.toString() || "Error!"
        });
      };
    });
  };

  const get = (key) => {
    return new Promise(async (resolve, reject) => {
      if (!db) {
        await open();
      }
      let store = db.transaction([dbName], 'readonly').objectStore(dbName);
      let req = store.get(key);
      req.onsuccess = (e) => {
        let result = req.result;
        let value = null;
        if (result && result.value) {
          value = result.value;
        }
        resolve({
          "key": key,
          "value": value
        });
      };
      req.onerror = req.onblocked = (err) => {
        reject({
          "code": 400,
          "message": err.message || err.toString() || "Error!"
        });
      };
    });
  };

  const del = (keys = []) => {
    return new Promise(async (resolve, reject) => {
      if (!db) {
        await open();
      }
      let store = db.transaction([dbName], 'readwrite').objectStore(dbName);
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
        reject({
          "code": 400,
          "message": err.message || err.toString() || "Error!"
        });
      };
    });
  };

  const list = (query) => {
    return new Promise(async (resolve, reject) => {
      if (!db) {
        await open();
      }
      let store = db.transaction([dbName], 'readonly').objectStore(dbName);
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
            result = {
              "key": cursor.value.key,
              "value": cursor.value.value
            };
          } else {
            result = cursor.key;
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
      await close();
      let req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = function() {
        let e = {
          "db": dbName,
          "event": "deleteDB",
          "timestamp": Date.now()
        };
        eventHandler(e);
        resolve(e);
      };
      req.onerror = req.onblocked = (e) => {
        reject({
          "code": 400,
          "message": "Error deleting database. " + e.toString()
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
      if (!db) {
        await open();
      }
      let store = db.transaction([dbName], 'readwrite').objectStore(dbName);
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

      for (let x = 0; x < items.length; x++) {
        let req = await store.put({
          "key": items[x].key,
          "value": items[x].value
        });
      }

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
