'use strict';

const path = require('path');
const Database = require(__dirname + path.sep + 'database');

function DBService(rootPath) {

  let dbs = {};

  let manager = () => {
    for(let db in dbs) {
      if (dbs[db].last <= (Date.now() - 9999)) {
        dbs[db].db.close().then(closed=>{
          delete dbs[db];
          //console.log(db + ' closed');
        });
      }
    }
  };

  setInterval(()=>{
    manager();
  },10000);

  let service = {};

  service.getDB = (dbName) => {
    if (dbs[dbName]) {
      dbs[dbName].last = Date.now() + 10000;
      //console.log(dbName + " used");
      return dbs[dbName].db;
    } else {
      let db = Database(rootPath.replace(/\/$/,'') + '/' + dbName);
      dbs[dbName] = {"db":db,"last":Date.now() + 10000};
      //console.log(dbName + " opened");
      return dbs[dbName].db;
    }
  };

  return service;

}

module.exports = DBService;
