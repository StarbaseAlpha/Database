'use strict';

const path = require('path');
const Database = require(__dirname + path.sep + 'database');

function DBService(rootPath, options = {}) {

  let dbs = {};

  let manager = () => {
    for(let db in dbs) {
      if (dbs[db].last <= (Date.now() - 9999) && !dbs[db].keepalive) {
        dbs[db].db.close().then(closed=>{
          delete dbs[db];
          console.log(db + ' closed');
        });
      }
    }
  };

  let runManager = null;

  let service = {};

  let closeAll = () => {
    for(let db in dbs) {
      dbs[db].db.close().then(closed=>{
        delete dbs[db];
        console.log(db + ' closed');
      });
    }
    dbs = {};
  };

  service.start = () => {
    runManager = setInterval(()=>{
      manager();
    },options.managerInterval || 10000);
  };

  service.stop = () => {
    clearInterval(runManager);
    closeAll();
  };

  service.getDB = (dbName,options = {}) => {
    if (dbs[dbName]) {
      dbs[dbName].last = Date.now() + 10000;
        console.log(dbName + " used");
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
      dbs[dbName] = {"db":db,"keepalive":keepalive, "last":Date.now() + 10000};
        console.log(dbName + " opened");
      return dbs[dbName].db;
    }
  };

  return service;

}

module.exports = DBService;
