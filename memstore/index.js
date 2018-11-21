'use strict';

function memstore() {

  let store = {};
  let data = {};
  let onEvent;

  let eventHandler = (e) => {
    if (onEvent && typeof onEvent === 'function') {
      onEvent(e);
    }
  };

  store.onEvent = (cb) => {
    onEvent = cb;
  };

  store.put = async (key,value) => {
    data[key] = value;
    let e = {
      "event": "write",
      "key": key,
      "timestamp": Date.now()
    };
    eventHandler(e);
    return e;
  };

  store.get = async (key) => {
    return {"key":key,"value":data[key]};
  };

  store.del = async (keys) => {
    let keyPaths = [];
    if (typeof keys === 'string') {
      keyPaths = [keys];
    } else {
      keyPaths = keys;
    }
    keyPaths.forEach(key => {
      delete data[key];
    });
    let e = {
      "event": "delete",
      "keys": keyPaths,
      "timestamp": Date.now()
    };
    eventHandler(e);
    return e;
  };

  store.list = async (query) => {
    query = query || {};
    let items = [];
    for(let key in data) {
      if (query.values) {
        items.push({"key":key,"value":data[key]});
      } else {
        items.push(key);
      }
    }
    if (query.values) {
      items.sort((a,b)=>{
        if (a.key < b.key) {
          return -1;
        }
        if (a.key > b.key) {
          return 1;
        }
        return 0;
      });
    } else {
      items.sort();
    }
    if (query.reverse) {
      items.reverse();
    }
    let results = [];
    for(let i = 0; i < items.length; i++) {
      if (query.limit && results.length >= query.limit) {
        break;
      }
      if (query.gt || query.lt) {
        if (query.values) {
          if ((query.gt && items[i].key <= query.gt) || (query.lt && items[i].key >= query.lt)) {
            // do nothing
          } else {
            results.push(items[i]);
          }
        }
        if (!query.values) {
          if ((query.gt && items[i] <= query.gt) || (query.lt && items[i] >= query.lt)) {
            // do nothing
          } else {
            results.push(items[i]);
          }
        }
      } else {
        results.push(items[i]);
      }
    }
    return results;
  };

  store.importDB = async (items) => {
    items.forEach(item=>{
      data[item.key] = item.value;
    });
    let e = {
      "event": "importDB",
      "keys": items.map(val=>{return val.key;}),
      "timestamp": Date.now()
    };
    eventHandler(e);
    return e;
  };

  store.exportDB = async () => {
    return store.list({"values":true});
  };

  store.deleteDB = async () => {
    data = {};
    let e = {
      "event": "deleteDB",
      "timestamp": Date.now()
    };
    eventHandler(e);
    return e;
  };

  return store;

}

// If NodeJS, export memstore as module.exports
if (typeof module !== 'undefined' && module && module.exports) {
  module.exports = memstore;
}
