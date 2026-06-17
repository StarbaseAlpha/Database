'use strict';

const {Level} = require('level');

function Database(dbPath) {

  let DB = new Level(dbPath, { valueEncoding: 'json' });
  let db = {};

  let onEvent;

  let eventHandler = (e) => {
    if (onEvent && typeof onEvent === 'function') {
      onEvent(e);
    }
  };

  db.onEvent = (cb) => {
    onEvent = cb;
  }; 

  db.put = (key,value) => {
    return new Promise((resolve,reject) => {
      DB.put(key,value).then(()=> {
        let e = {
          "event": "write",
          "key": key,
          "timestamp": Date.now()
        };
        eventHandler(e);
        resolve(e);
      }).catch(err=>{
        reject({"code":400, "message":"Failed to write data to key."});
      });
    });
  };

  db.get = (key) => {
    return new Promise((resolve,reject) => {
      DB.get(key).then(result=>{
        resolve({"key":key,"value":result});
      }).catch(err=>{
        if (err && err.type && err.type === 'NotFoundError') {
          return resolve({"key":key, "value":null});
        }
        reject({"code":err.code||400, "message":err.message||err.error||err.toString()||'Error!'});
      });
    });
  };

  db.del = (keys) => {
    return new Promise((resolve,reject) => {
      let keyPaths = [];
      if (!keys) {
        return reject({"code":400,"message":"A key or an array of keys is required."});
      }
      if (typeof keys === 'string') {
        keyPaths = [keys];
      } else {
        keyPaths = keys;
      }
      let ops = [];
      keyPaths.forEach(path=>{
        ops.push({"type":"del","key":path});
      });
      DB.batch(ops).then(result=>{
        let e = {
          "event": "delete",
          "keys": keyPaths,
          "timestamp": Date.now()
        };
        eventHandler(e);
        resolve(e);
      }).catch(err=>{
        reject({"code":400, "message":"Failed to delete key."});
      });
    });
  };  

  db.list = (query={}) => {
    return new Promise(async (resolve, reject) => {
      if (!query.values || query.values === 'false') {
        query.values = false;
        query.keys = true;
      }

      if (query.limit) {
        query.limit = parseInt(query.limit);
      }

      if (query.reverse === 'false') {
        query.reverse = false;
      }

      let results = [];

      try {
        for await (const [key, value] of DB.iterator(query)) {
          if (query.values) {
            results.push({"key": key, "value": value});
          } else {
            results.push(key);
          }
        }
        return resolve(results);
      } catch (err) {
        return reject({"code": 400, "message": "Error listing keys."});
      }
    });
  };

  db.exportDB = () => {
    return new Promise(async (resolve, reject) => {
      let payload = [];
      try {
        for await (const [key, value] of DB.iterator()) {
          payload.push({ key, value });
        }
        resolve(payload);
      } catch (err) {
        reject({"code": 400, "message": err.message || err.toString() || "Unknown Error"});
      }
    });
  };

  db.importDB = (data=[]) => {
    return new Promise((resolve,reject)=>{
      let ops = [];
      data.forEach(item=>{
        ops.push({"type":"put","key":item.key,"value":item.value});
      });
      if (ops && ops.length > 0) {
        DB.batch(ops).then(()=>{
          let e = {
            "event": "importDB",
            "keys": data.map(val=>{return val.key;}),
            "timestamp": Date.now()
          };
          resolve(e);
        });
      } else {
        reject({"code":400,"message":"Database is empty."});
      }
    });
  };

  db.deleteDB = () => {
    return new Promise(async (resolve, reject) => {
      try {
        await DB.close();
        await Level.destroy(dbPath);
        let e = {
          "event": "deleteDB",
          "timestamp": Date.now()
        };
        resolve(e);
      } catch (err) {
        reject({"code": 400, "message": err.message || err.toString() || "Unknown Error"});
      }
    });
  };

  db.close = () => {
    return new Promise((resolve,reject) => {
      DB.close().then(()=>{
        resolve({"message":"Database closed."});
      }).catch(err=>{
        reject({"Code":400,"message":"Error closing database - " + (err.message||err.toString())});
      });
    });
  };

  db.open = () => {
    return new Promise((resolve,reject) => {
      DB.open().then(()=>{
        resolve({"message":"Database opened."});
      }).catch(err=>{
        reject({"Code":400,"message":"Error opening database - " + (err.message||err.toString())});
      });
    });
  };

  return db;

}

module.exports = Database;
