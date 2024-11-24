const { MongoClient } = require("mongodb");
const Memcached = require("memcached");
const memcached = new Memcached({ "cache:11211": 1 });

const uri = "mongodb://root:example@db:27017";

const client = new MongoClient(uri);

client.connect().then(() => console.log("DB CONNECTED"));

const db = client.db("cse356");

function cacheGet(key) {
  return new Promise((resolve, reject) => {
    memcached.gets(key, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

const insert = async (collection, data) => {
  const toCol = db.collection(collection);
  const res = await toCol.insertOne(data);
  // Invalidate Cache
  console.log("Invalidateing", collection)
  memcached.del(collection, (err, data) => {
    console.log("DELETE", data)
  });
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

const getAll = async (collection, filter = {}) => {
  // Check Cache if the request wants ALL
  let cacheResult = null

  if(isEmpty(filter)){
    cacheResult = await cacheGet(collection);
  }

  if (cacheResult && !isEmpty(cacheResult[collection])) {
    console.log("getAll", JSON.parse(cacheResult[collection]).length)
    return JSON.parse(cacheResult[collection]);
  }

  console.log("getAll Cache Miss")
  // Find and Set Cache
  const toCol = db.collection(collection);
  const res = await toCol.find(filter);
  const data = await res.toArray()
  memcached.set(`${collection}`, JSON.stringify(data), 6000, function (err) {});
  return data;
};

const getOne = async (collection, filter = {}) => {
  // Check Cache
  const key = `${filter._id}`
  const cacheResult = await cacheGet(key);

  if (cacheResult !== undefined && !isEmpty(cacheResult[key])) {
    return JSON.parse(cacheResult[key]);
  }

  // Find and Set Cache
  const res = await getAll(collection, filter);
  const data = res[0]
  memcached.set(key, JSON.stringify(data === undefined ? [] : data), 6000, function (err) {});
  return data;
};

const update = async (collection, filter = {}, expr = {}) => {
  // Do the Update
  const toCol = db.collection(collection);
  await toCol.updateOne(filter, expr);
  const res = await getAll(collection, filter);
  //Invalidate Cache
  console.log("Invalidating", collection)
  console.log("Invalidating", `${collection}-${filter._id}`)
  memcached.del(`${collection}-${filter._id}`);
  memcached.del(collection);
  return res.upsertedId;
};

exports.insertToDb = insert;
exports.getAllfromDb = getAll;
exports.getOnefromDb = getOne;
exports.updateToDb = update;

// getEverything -> get every video or get every user
// getOneThing -> get a single user or a single video

// What makes this outdated?
// getEverything -> INSERTED, UPDATED
// getOneThing -> UPDATED
