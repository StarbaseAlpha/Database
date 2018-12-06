'use strict';

const path = require('path');
const Database = require(__dirname + path.sep + '..' + path.sep + 'node' + path.sep + 'database');

function DBService(rootPath, options = {}) {

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

  service.close = async (dbName) => {
    if (dbs[dbName]) {
      dbs[dbName].close().then(closed => {
        if (dbs[dbName].onClose && typeof dbs[dbName].onClose === 'function') {
          dbs[dbName].onClose(dbName);
        }
        delete dbs[dbName];
        //console.log(dbName + ' closed');
        return true;
      });
    } else {
      return false;
    }
  };

  service.closeAll = closeAll;

  service.getDB = (dbName,options = {}) => {
    if (dbs[dbName]) {
      dbs[dbName].last = Date.now() + managerInterval;
        //console.log(dbName + " used");
      return dbs[dbName].db;
    } else {
      let db = Database(rootPath.replace(/\/$/,'') + '/' + dbName);
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
      dbs[dbName] = {"db":db,"name":dbName, "keepalive":keepalive, "onClose":onClose, "last":Date.now() + managerInterval};
      //console.log(dbName + " opened");
      return dbs[dbName].db;
    }
  };

  return service;

}

module.exports = DBService;
