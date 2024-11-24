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
  memcached.del(collection);
  return res.insertedId;
};

const getAll = async (collection, filter = {}) => {
  // Check Cache
  const cacheResult = await cacheGet(collection);

  if (cacheResult) {
    return cacheResult;
  }

  // Find and Set Cache
  const toCol = db.collection(collection);
  const res = await toCol.find(filter);
  memcached.set(`${collection}`, res.toArray(), 6000, function (err) {});
  return res.toArray();
};

const getOne = async (collection, filter = {}) => {
  // Check Cache
  const cacheResult = await cacheGet(`${collection}-${filter._id}`);
  console.log(cacheResult);
  if (cacheResult) {
    return cacheResult;
  }

  // Find and Set Cache
  const res = await getAll(collection, filter);
  memcached.set(`${collection}-${filter._id}`, res[0], 6000, function (err) {});
  return res[0];
};

const update = async (collection, filter = {}, expr = {}) => {
  // Do the Update
  const toCol = db.collection(collection);
  await toCol.updateOne(filter, expr);
  const res = await getAll(collection, filter);
  // Update/Invalidate Cache
  memcached.set(`${collection}-${filter._id}`, res[0], 6000, function (err) {});
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
