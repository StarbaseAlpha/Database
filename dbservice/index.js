'use strict';

const path = require('path');
const Database = require(__dirname + path.sep + '..' + path.sep + 'node' + path.sep + 'database');

function DBService(options = {}) {

  let dbs = {};

  let manager = () => {
    for(let db in dbs) {
      if (dbs[db].last <= (Date.now() - managerInterval) && !dbs[db].keepalive) {
        dbs[db].db.close().then(closed=>{
          if (dbs[db].onClose && typeof dbs[db].onClose === 'function') {
            dbs[db].onClose(dbs[db].name);
          }
          delete dbs[db];
          //console.log(db + ' closed');
        });
      }
    }
  };

  let runManager;
  let managerInterval = parseInt(options.managerInterval||10000);
  let service = {};

  let closeAll = () => {
    for(let db in dbs) {
      dbs[db].db.close().then(closed=>{
        if (dbs[db].onClose && typeof dbs[db].onClose === 'function') {
          dbs[db].onClose(dbs[db].name);
        }
        delete dbs[db];
        //console.log(db + ' closed');
      });
    }
  };

  service.start = () => {
    runManager = setInterval(()=>{
    //console.log('Manage');
      manager();
    },managerInterval);
  };
  service.start();

  service.stop = () => {
    clearInterval(runManager);
  };

  service.close = async (dbPath) => {
    if (dbs[dbPath]) {
      dbs[dbPath].close().then(closed => {
        if (dbs[dbPath].onClose && typeof dbs[dbPath].onClose === 'function') {
          dbs[dbPath].onClose(dbPath);
        }
        delete dbs[dbPath];
        //console.log(dbPath + ' closed');
        return true;
      });
    } else {
      return false;
    }
  };

  service.closeAll = closeAll;

  service.getDB = (dbPath,options = {}) => {
    if (dbs[dbPath]) {
      dbs[dbPath].last = Date.now() + managerInterval;
        //console.log(dbPath + " used");
      return dbs[dbPath].db;
    } else {
      let db = Database(dbPath);
      if (options.onEvent) {
        db.onEvent(options.onEvent);
      }
      let keepalive = false;
      if (options.keepalive) {
        keepalive = true;
      }
      let onClose = null;
      if (options.onClose) {
        onClose = options.onClose;
      }
      dbs[dbPath] = {"db":db,"name":dbPath, "keepalive":keepalive, "onClose":onClose, "last":Date.now() + managerInterval};
      //console.log(dbPath + " opened");
      return dbs[dbPath].db;
    }
  };

  return service;

}

module.exports = DBService;
