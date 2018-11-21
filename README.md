# Starbase Database
Portable Data for Node.js and The Web

Starbase Database is a key-value data store for storing, accessing, and transferring data in modern, progressive web applications. Starbase Database is powerful, portable, lightweight and fast. With an easy to use API, the database removes the complications involved with underlining storage mechanisms.

IndexedDB is used for persistent storage on the web. LevelDB is used for persistent storage on the server (node.js). An optional memory store is also provided for fast read/write operations on temporary and ephemeral data.

The web database is great for quickly utilzing IndexedDB without the hassle of initializing, opening, and updating databases and data stores. It even works offline and within service workers.

It was built from the ground up to serve as the base for Starbase Channels and the Starbase Rules Engine. The minified database.min.js web version is under 5KB and has little reason to ever grow much larger.



## Adding Starbase Database to your Project


### On the Web
```HTML
<script src="/path/to/database.min.js"></script>
<script src="/path/to/memstore.min.js"></script>
```

### In NodeJS
```bash
npm install @starbase/database 
```



## Using the Database


### Create a database in the browser using database.min.js:
Data is saved to an IndexedDB database with the specified name (testdb)

```javascript
var db = Database('testdb');
```

### Create a database in NodeJS using @starbase/database:
Data is saved as a LevelDB database in the specified directory (/path/to/testdb)
```javascript
var Database = require('@starbase/database');
var db = Database('/path/to/testdb');
```

### Create a database in Memory in Node.js using @starbase/database/memstore:
Data will persist until the app stops or is terminated

```javascript
var memstore = require('@starbase/database/memstore');
var db = memstore('/path/to/testdb');
```

### Create a database in Memory in the browser using memstore.min.js:
Data will persist until the browser refreshes

```javascript
var memstore = require('@starbase/database/memstore');
var db = memstore('/path/to/testdb');
```



## API Methods

All methods return a promise and are available in all data stores, except when they are not.

- db.put()
- db.get()
- db.del()
- db.list()
- db.exportDB()
- db.importDB()
- db.deleteDB()
- db.open()
- db.close()


### db.put(key, value)
#### Put the string 'hello world' into the key 'hello'
```javascript
db.put('hello','Hello world').then(result =>{

  // an object with the write event information is resolved
  console.log(result);

});
```

### db.get(key)
#### Get the data stored in the key 'hello'
```javascript
db.get('hello').then(result => {
  
  //  an object with the key and value is resolved
  console.log(result);

});
```

### db.del(key)
#### Delete the data stored in the key 'hello'
```javascript
db.del('hello').then(result => {
  
  // an object with the delete event information is resolved
  console.log(result);

});
```

### db.list(query)
#### List the keys stored in the database
```javascript
db.list().then(result => {
  
  //  an array of the key is resolved
  console.log(result);

});
```

#### List keys with values, ranges, and limits
```javascript
db.list({

  // Range in reverse lexicographical order
  "reverse": true,
  
  // Limit results to 10
  "limit":10,
  
  // Return results as objects containing the key and value
  "values": true,
  
  // key must be greater than 'abba'
  "gt": "abba",
  
  // key must be less than 'zztop'
  "lt": "zztop"

}).then(result => {
  
  //  an array of objects containing the key and value of each result is resolved
  console.log(result);

});
```

### db.deleteDB()
#### Delete the database
```javascript
db.deleteDB().then(result => {

  // an object with the deleteDB event information is resolved
  console.log(result);

});
```

### db.exportDB()
#### Export the database as an array of objects with key-value pairs
```javascript
db.deleteDB().then(result => {

  // an array of objects containing the key value pairs of all data in the database.
  console.log(result);

});
```

### db.importDB(dbArray)
#### Import a previously exported database array
```javascript
db.importDB(exportedDB).then(result => {

  // an object with the importDB event information is resolved
  console.log(result);
  
});
```

#### Import from an Export
```javascript
mem.exportDB().then(db.importDB).then(console.log);
```

### db.close()
#### Close the database (node.js only)
```javascript
db.close().then(result => {

  // The database was closed.
  console.log(result);

});
```

### db.open()
#### Open a previously closed database (node.js only)
```javascript
db.open().then(result => {

  // The database was closed.
  console.log(result);

});
```

## More Information

### Motivations
This database module exists retroactively in space-time to provides the data storage and maintenance operations for Starbase Channels. While it is handy as a key-value data store, it is even more useful when paired with the Starbase Channels and Starbase Rules Engine modules. Long ago, the three modules were one. Now they are not.

### database.min.js (web database)
The Web Database Storage Engine (Database) is built for the browser and is the original model for the other storage engines. Data is stored within an IndexedDB store that shares the name of the IndexedDB database it lives within. Data persists between browser sessions. The API for accessing the database is simple compared to the standard IndexedDB API. The desire for an easy way to store and access IndexedDB was the motivation behind this library.

The database is suitable for storing relatively large amounts of data in the browser that needs to persist between browser sessions. The webstore can be useful for storing fetch results from an external API, and then loading them again on a browser refresh, rather than making a network request back to the external API for the same data.

The database does not use, leverage, or even acknowledge IndexedDB indexes. It treats the database as a key-value store. Other limitations of the database can vary depending on the web browser. In general, there is a maximum amount of space that the web browser will allow for each IndexedDB database. In some cases, exceeding that amount may cause the browser to prompt the user to raise the limit, or may even delete old data to make room for new data. If the user clears their browser history and cache, this can also remove the data. Treat the web database as a "mostly" persistent data store.

### @starbase/database (node.js database)
The NodeJS Database Storage Engine uses LevelDB as the underlining storage mechanism and is suitable for permanent persistent storage on a Node.js server. This data store was built as a companion to the client-side web database to allow for the server and client to syncronize data between each other and share the same overarching database structure.

The database provides a key-value data store in Node.js applications that can be used for persistent storage in express APIs. Like the memstore and webstore, the dbstore shares the same CRUD and management operations, as well as database OPEN and CLOSE methods. This can be useful on the server side if an application needs access to multiple databases that may need to be opened, used, and then closed when no longer needed.

The database shares the limitations of LevelDB. Data can be written very fast, and even faster in batch operations. Limited range queries can also be very fast. It is said that LevelDB is not as efficient at requesting random individual keys. While this limitation exist, in my personal experience I have not found it to be an issue. In some cases, there is a possibility of data loss should uncommitted writes be lost in the event of low memory or a sudden application termination.

### memstore.min.js (memstore)
The Memory Storage Engine (memstore) stores data in memory and functions as a data store on Node.js and in the browser. When used in a Node.js application, the data will persist until the application stops or is terminated. In the browser, the data persists until the window/tab is refreshed or closed.

Memory storage is suitable for temporarily storing and managing data in memory. One use case is storing data in the browser that is then displayed to the user. Changes can be made to the memory store data and then exported and saved in a more permanent storage engine or discarded. On the server, a memory store could be used as a cache for frequently accessed data.

Memory stores can write (and often access) data faster than permanent storage engines with some important limitations to consider. The amount of physical memory available to the server or browser should be considered when storing and accessing data from a memory store. Large datasets (many MBs in size) can be slow or sluggish depending on the resources available to the application. It is best to store large amounts of data in a permanent storage engine and use memory storage for caching and managing smaller sets of data.
