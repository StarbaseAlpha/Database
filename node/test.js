'use strict';

const path = require('path');
const database = require(__dirname + path.sep + 'database');
const db = database(__dirname + path.sep + 'testdb1');

let items = Array.from(new Uint8Array(1000)).map((val,idx)=>{
  return {"key":"item" + idx, "value":{"timestamp":Date.now()}};
});

async function Test() {
  let key = "hello";
  let data = {"message":"Hello world"};
  let write = await db.put(key,data);
  console.log(write);
  let read = await db.get(key);
  console.log(read);
  console.log('importing items now...');
  let imp = await db.importDB(items);
  console.log(imp);
  let exp = await db.exportDB();
  console.log(exp);
  let list = await db.list({"values":1,"limit":10,"gt":"item900", "lt":"item905"});
  console.log(list);
  let del = await db.del([key]);
  console.log(del);
  let notfound = await db.get('nothing');
  console.log(notfound);
  let opendb = await db.open();
  console.log(opendb);
  let closedb = await db.close();
  console.log(closedb);
  let deldb = await db.deleteDB();
  console.log(deldb);
}

Test();
