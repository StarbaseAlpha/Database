'use strict';

function Database(dbName) {

  let database = {};

  database.put = (dbName, key, data) => {
    return new Promise((resolve, reject) => {
      if (!dbName) {
        return reject({
          "code": 400,
          "message": "dbName (Database Name) is required."
        });
      }
      if (!key) {
        return reject({
          "code": 400,
          "message": "A key is required."
        });
      }
      let db;
      let open = indexedDB.open(dbName, 1);
      open.onupgradeneeded = () => {
        db = open.result;
        db.createObjectStore(dbName);
      };
      open.onsuccess = () => {
        db = open.result;
        let tx = db.transaction(dbName, 'readwrite');
        let store = tx.objectStore(dbName);
        let request = store.put(data, key);
        tx.oncomplete = () => {
          resolve({
            "db": dbName,
            "event": "write",
            "key": key,
            "timestamp": Date.now()
          });
          db.close();
        };
        tx.onerror = (err) => {
          db.close();
          reject(err);
        };
      };
    });
  };

  database.get = (dbName, key) => {
    return new Promise((resolve, reject) => {
      if (!dbName) {
        return reject({
          "code": 400,
          "message": "dbName (Database Name) is required."
        });
      }
      if (!key) {
        return reject({
          "code": 400,
          "message": "A key is required."
        });
      }
      let db;
      let open = indexedDB.open(dbName, 1);
      open.onupgradeneeded = () => {
        db = open.result;
        db.createObjectStore(dbName);
      };
      open.onsuccess = () => {
        db = open.result;
        let tx = db.transaction(dbName, 'readonly');
        let store = tx.objectStore(dbName);
        let request = store.get(key);
        tx.oncomplete = () => {
          resolve({
            "key": key,
            "value": request.result
          });
          db.close();
        };
        tx.onerror = (err) => {
          db.close();
          reject(err);
        };
      };
    });
  };

  database.del = (dbName, keys) => {
    return new Promise((resolve, reject) => {
      if (!dbName) {
        return reject({
          "code": 400,
          "message": "dbName (Database Name) is required."
        });
      }
      if (!keys) {
        return reject({
          "code": 400,
          "message": "A key or an array of keys is required."
        });
      }

      let keyPaths = [];
      if (typeof keys === 'string') {
        keyPaths = [keys];
      } else {
        keyPaths = keys;
      }

      let db;
      let open = indexedDB.open(dbName, 1);
      open.onupgradeneeded = () => {
        db = open.result;
        db.createObjectStore(dbName);
      };
      open.onsuccess = () => {
        db = open.result;
        let tx = db.transaction(dbName, 'readwrite');
        let store = tx.objectStore(dbName);
        for(let i = 0; i < keyPaths.length; i++) {
          let request = store.delete(keyPaths[i]);
        }
        tx.oncomplete = () => {
          resolve({
            "db": dbName,
            "event": "delete",
            "keys": keyPaths,
            "timestamp": Date.now()
          });
          db.close();
        };
        tx.onerror = (err) => {
          db.close();
          reject(err);
        };
      };
    });
  };

  database.list = (dbName, query) => {
    return new Promise((resolve, reject) => {
      if (!dbName) {
        return reject({
          "code": 400,
          "message": "dbName (Database Name) is required."
        });
      }
      let db;
      let open = indexedDB.open(dbName, 1);
      open.onupgradeneeded = () => {
        db = open.result;
        db.createObjectStore(dbName);
      };
      open.onsuccess = () => {
        db = open.result;
        let tx = db.transaction(dbName, 'readwrite');
        let store = tx.objectStore(dbName);
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
        let request = store.openCursor(IDBKeyRange.bound(gt, lt, true, true), reverse);
        request.onsuccess = () => {
          let cursor = request.result;
          if ((!limit && cursor) || (results.length < limit && cursor)) {
            let result = {};
            if (query.values) {
              result.key = cursor.primaryKey;
              result.value = cursor.value;
            } else {
              result = cursor.primaryKey;
            }
            results.push(result);
            cursor.continue();
          }
        };
        tx.oncomplete = () => {
          db.close();
          resolve(results);
        };
        tx.onerror = (err) => {
          db.close();
          reject(err);
        };
      };
    });
  };

  database.deleteDB = (dbName) => {
    return new Promise((resolve, reject) => {
      if (!dbName) {
        return reject({
          "code": 400,
          "message": "dbName (Database Name) is required."
        });
      }
      let request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => {
        let e = {
          "db": dbName,
          "event": "deleteDB",
          "timestamp": Date.now()
        };
        resolve(e);
      };
      request.onerror = request.onblocked = (err) => {
        reject({
          "code": 400,
          "message": "Error deleting database. " + err.toString()
        });
      };
    });
  };

  database.exportDB = (dbName) => {
    return database.list(dbName,{"values":true});
  };

  database.importDB = (dbName, items) => {
    return new Promise((resolve, reject) => {
      if (!dbName) {
        return reject({
          "code": 400,
          "message": "dbName (Database Name) is required."
        });
      }
      let db;
      let open = indexedDB.open(dbName, 1);
      open.onupgradeneeded = () => {
        db = open.result;
        db.createObjectStore(dbName);
      };
      open.onsuccess = () => {
        db = open.result;
        let tx = db.transaction(dbName, 'readwrite');
        let store = tx.objectStore(dbName);
        for (let x = 0; x < items.length; x++) {
          let request = store.put(items[x].value, items[x].key);
        }
        tx.oncomplete = () => {
          let e = {
            "db": dbName,
            "event": "importDB",
            "keys": items.map(val=>{return val.key;}),
            "timestamp": Date.now()
          };
          db.close();
          resolve(e);
        };
        tx.onerror = (err) => {
          db.close();
          reject({
            "code": 400,
            "message": "Error importing database. " + err.toString()
          });
        };
      };
    });
  };

  database.db = (dbName) => {

    if (!dbName) {
      dbName = "test";
    }

    let db = {};
    let onEvent;

    db.onEvent = (cb) => {
      onEvent = cb;
    };

    let eventHandler = (e) => {
      if (onEvent && typeof onEvent === 'function') {
        onEvent(e);
      }
    };

    db.put = (key, data) => {
      return new Promise((resolve,reject) => {
        database.put(dbName, key, data).then(result=>{
          eventHandler(result);
          resolve(result);
        }).catch(reject);
      });
    };

    db.get = (key, data) => {
      return database.get(dbName, key);
    };

    db.del = (keys) => {
      return new Promise((resolve,reject) => {
        database.del(dbName, keys).then(result=>{
          eventHandler(result);
          resolve(result);
        }).catch(reject);
      });
    };

    db.list = (query) => {
      return database.list(dbName, query);
    };

    db.deleteDB = () => {
      return new Promise((resolve,reject) => {
        database.deleteDB(dbName).then(result=>{
          eventHandler(result);
          resolve(result);
        }).catch(reject);
      });
    };

    db.exportDB = () => {
      return database.exportDB(dbName);
    };

    db.importDB = (data) => {
      return new Promise((resolve,reject) => {
        database.importDB(dbName, data).then(result=>{
          eventHandler(result);
          resolve(result);
        }).catch(reject);
      });
    };

    return db;

  };

  return database.db(dbName);

}
