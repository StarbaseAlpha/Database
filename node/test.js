'use strict';

const path = require('path');
const database = require(__dirname + path.sep + 'database');
const db = database(__dirname + path.sep + 'testdb1');

async function Test() {
  let key = "hello";
  let data = {"message":"Hello world"};
  let write = await db.put(key,data);
  console.log(write);
  let read = await db.get(key);
  console.log(read);
  let exp = await db.exportDB();
  console.log(exp);
  let imp = await db.importDB(exp);
  console.log(imp);
  let list = await db.list();
  console.log(list);
  let del = await db.del(key);
  console.log(del);
  let opendb = await db.open();
  console.log(opendb);
  let closedb = await db.close();
  console.log(closedb);
  let deldb = await db.deleteDB();
  console.log(deldb);
}

Test();
