const { MongoClient } = require("mongodb");

const uri = "mongodb://root:example@db:27017";

const client = new MongoClient(uri);

client.connect().then(()=> console.log("DB CONNECTED"))

const db = client.db("cse356")


const insert = async (collection, data) => {
    const toCol = db.collection(collection)
    const res = await toCol.insertOne(data)
    return res.insertedId
}

// user._id is their email
// video._id is the video id
// this returns an array
const getAll = async (collection, filter={}) => {
    const toCol = db.collection(collection)
    const res = await toCol.find(filter)
    return res.toArray()    
}

const getOne = async (collection, filter={}) => {
    const res = await getAll(collection, filter)
    return res[0] 
}

const update = async (collection, filter={}, expr={}) => {
    const toCol = db.collection(collection)
    const res = await toCol.updateOne(filter, expr)
    return res.upsertedId
}

exports.insertToDb = insert
exports.getAllfromDb = getAll
exports.getOnefromDb = getOne
exports.updateToDb = update