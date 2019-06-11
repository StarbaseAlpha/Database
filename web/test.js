async function Test() {
  let results = {"success":[],"events":[],"error":[]};
  let db = Database('testdb');
  let key = "hello";
  let data = {"message":"Hello world"};
  db.onEvent(e=>{
    results.events.push(e);
  });
  let write = await db.put(key,data).then(result => {
    results.success.push(result);
  }).catch(err => {
    results.error.push(err);
  });
  let read = await db.get(key).then(result=>{results.success.push(result);}).catch(err=>{results.error.push(err);});
  let exp = await db.exportDB().then(result=>{results.success.push(result);}).catch(err=>{results.error.push(err);});
  let imp = await db.importDB(exp).then(result=>{results.success.push(result);}).catch(err=>{results.error.push(err);});
  let list = await db.list().then(result=>{results.success.push(result);}).catch(err=>{results.error.push(err);});
  let del = await db.del(key).then(result=>{results.success.push(result);}).catch(err=>{results.error.push(err);});
  let closedb = await db.close().then(result=>{results.success.push(result);}).catch(err=>{results.error.push(err);});
  let deldb = await db.deleteDB().then(result=>{results.success.push(result);}).catch(err=>{results.error.push(err);});
  return results;
}
