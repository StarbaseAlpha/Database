'use strict';

const DBService = require('./index');

const service = DBService('./',{
  "managerInterval":1000
});

let x = 0;
let run = setInterval(()=>{
  let y = parseInt(x);
  x = x + 1;
  let keepalive = false;
  if (y < 1) {
    keepalive = true;
  }
  service.getDB('testDB' + y,{"keepalive":keepalive,"onClose":(e)=>{

    let x = service.getDB(e);
    x.deleteDB().then(console.log);
    console.log('i closed',e);

  },"aonEvent":(e) =>{console.log('i put', e);}}).put({"ok":"cool"}).then(result=>{
    console.log(result);
  });
},300);


setTimeout(()=> {
  clearInterval(run);
  service.stop();
  service.closeAll();
},10000);
