const { MongoClient } = require("mongodb");

const uri = "mongodb://root:example@db:27017";

const client = new MongoClient(uri);

client.connect().then(() => console.log("DB CONNECTED"));

const db = client.db("cse356");

const createIndex = async(colllection, key) => {
  const toCol = db.collection(colllection);
  return toCol.createIndex(key)
}

const insert = async (collection, data) => {
  const toCol = db.collection(collection);
  const res = await toCol.insertOne(data);
  // Invalidate Cache
  // console.log("Invalidateing", collection)
  // memcached.del(collection, (err, data) => {
  //   console.log("DELETE", data)
  // console.log("IS WRITE ACK?")
  // console.log(res.acknowledged)
  return res.insertedId;
};

function isEmpty(obj) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }

  return true;
}

// const getAll = async (collection, filter = {}) => {
//   // Check Cache if the request wants ALL
//   // let cacheResult = null

//   // if(isEmpty(filter)){
//   //   cacheResult = await cacheGet(collection);
//   // }

//   // if (cacheResult && !isEmpty(cacheResult[collection])) {
//   //   console.log("getAll", JSON.parse(cacheResult[collection]).length)
//   //   return JSON.parse(cacheResult[collection]);
//   // }

//   // Find and Set Cache
//   const toCol = db.collection(collection);
//   const res = await toCol.find(filter);
//   const data = await res.toArray()
//   // memcached.set(`${collection}`, JSON.stringify(data), 6000, function (err) {});
//   console.log("getAll return", data.length)
//   return data;
// };

const getAll = async (collection, filter={}) => {
  const toCol = db.collection(collection)
  const res = await toCol.find(filter)
  return res.toArray()    
}

const getOne = async (collection, filter={}) => {
  const res = await getAll(collection, filter)
  return res[0] 
}

// const getOne = async (collection, filter = {}) => {
//   // Check Cache
//   // const key = `${filter._id}`
//   // const cacheResult = await cacheGet(key);

//   // if (cacheResult !== undefined && !isEmpty(cacheResult[key])) {
//   //   return JSON.parse(cacheResult[key]);
//   // }

//   // Find and Set Cache
//   const res = await getAll(collection, filter);
//   const data = res[0]
//   // memcached.set(key, JSON.stringify(data === undefined ? [] : data), 6000, function (err) {});
//   console.log("GET ONE RETURN: ", data)
//   return data;
// };

const update = async (collection, filter = {}, expr = {}) => {
  // Do the Update
  const toCol = db.collection(collection);
  await toCol.updateOne(filter, expr);
  const res = await getAll(collection, filter);
  //Invalidate Cache
  // console.log("Invalidating", collection)
  // console.log("Invalidating", `${collection}-${filter._id}`)
  // memcached.del(`${collection}-${filter._id}`);
  // memcached.del(collection);
  return res.upsertedId;
};

const drop = async (collection) => {
  return db.collection(collection).drop();
};

exports.insertToDb = insert;
exports.getAllfromDb = getAll;
exports.getOnefromDb = getOne;
exports.updateToDb = update;
exports.dropDb = drop;
exports.createIndex = createIndex;
// getEverything -> get every video or get every user
// getOneThing -> get a single user or a single video

// What makes this outdated?
// getEverything -> INSERTED, UPDATED
// getOneThing -> UPDATED
