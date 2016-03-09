'use strict';

//const Promise = require('bluebird');
const MongoClient = require('mongodb').MongoClient;
const co = require('co');
const EventEmitter = require('events').EventEmitter;

const ee = new EventEmitter;

ee.on('error', (err) => {
    console.log(err);
    process.exit(666);
});

function Multivarka() {
    this._url = '';
    this._collectionName = '';
    this._field = '';
    this._isNegative = false;
    this._query = {};
    this._set = {$set: {}};
}

Multivarka.prototype = {
    server: function (url) {
        this._url = url || 'mongodb://localhost/urfu-2015';
        if (!(/^mongodb:\/\/localhost\/.+/i.test(this._url))) {
            ee.emit('error', new RangeError('Incorrect url, url should be determined like - ' +
                'mongodb://localhost/...'));
        }
        return this;
    },
    collection: function (collectionName) {
        this._collectionName = collectionName || 'students';
        return this;
    },
    where: function (fieldName) {
        this._field = fieldName;
        return this;
    },
    equal: function (value) {
        return this._isNegative ? this._initQuery({$ne: value}) : this._initQuery(value);
    },
    lessThan: function (value) {
        return this._isNegative ? this._initQuery({$gte: value}) :
            this._initQuery({$lt: value});
    },
    greatThan: function (value) {
        return this._isNegative ? this._initQuery({$lte: value}) :
            this._initQuery({$gt: value});
    },
    include: function (value) {
        return this._isNegative ? this._initQuery({$nin: value}) :
            this._initQuery({$in: value});
    },
    not: function () {
        this._isNegative = true;
        return this;
    },
    setValue: function (fieldName, value) {
        this._set['$set'][fieldName] = value;
        return this;
    },
    insert: function (value) {
        return this._connect(col => {
            return Array.isArray(value) ? col.insertMany(value) : col.insertOne(value);
        });
    },
    find: function () {
        return this._connect(col => {
            return col.find(this._query).toArray();
        });
    },
    update: function (isMany, isUpsert) {
        return this._connect(col => {
            const upsert = isUpsert ? {upsert: true} : {upsert: false};
            return isMany ? col.updateMany(this._query, this._set, upsert) :
                col.updateOne(this._query, this._set, upsert);
        });
    },
    remove: function () {
        return this._connect(col => {
            return col.remove(this._query);
        });
    },
    _initQuery: function (value) {
        if (!this._field) {
            ee.emit('error', new ReferenceError('You should call a where method with field name, ' +
                'before your query method'));
        }
        this._query[this._field] = value;
        return this;
    },
    _reset: function () {
        this._field = '';
        this._isNegative = false;
        this._query = {};
        this._set = {$set: {}};
    },
    _connect: function (crudFunc) {
        let db;
        return co(function* () {
            db = yield MongoClient.connect(this._url);
            const collection = db.collection(this._collectionName);
            return yield crudFunc(collection);
        }.bind(this))
        .then(result => {
            db.close();
            this._reset();
            return result;
        });
    }
    /*_connect: function (crudFunc, callback) {
        let db;
        co(function* () {
            db = yield MongoClient.connect(this._url);
            const collection = db.collection(this._collectionName);
            return yield crudFunc(collection);
        }.bind(this))
        .then(result => {
            db.close();
            this._reset();
            callback(null, result);
        })
        .catch(callback);
    }*/
};

/*process.on('uncaughtException', function (err) {
  console.log(err);
});*/


module.exports = Multivarka;




/*
var assert = require('assert');

var url = 'mongodb://localhost/myproject';

mongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    insertDocument(db, function () {
        updateDocument(db, function () {
            deleteDocument(db, function () {
                findDocuments(db, function () {
                    db.close();
                });
            });
        });
    });
});

var insertDocument = function (db, callback) {
    var collection = db.collection('documents');
    collection.insertMany([{a: 1}, {a: 2}, {a: 3}], function (err, result) {
        assert.equal(err, null);
        assert.equal(3, result.result.n);
        assert.equal(3, result.ops.length);
        console.log('Inserted 3 documents into the document collection');
        callback(result);
    });
};

var updateDocument = function (db, callback) {
    var collection = db.collection('documents');
    collection.updateOne({a: 2}, {$set: {b: 1}}, function (err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log('Updated the document with the field a equal to 2');
        callback(result);
    });
};

var deleteDocument = function (db, callback) {
    var collection = db.collection('documents');
    collection.deleteOne({a: 3}, function (err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log('Removed');
        callback(result);
    });
};

var findDocuments = function (db, callback) {
    var collection = db.collection('documents');
    collection.find({}).toArray(function (err, docs) {
        assert.equal(err, null);
        //assert.equal(2, docs.length);
        console.log("Found the following records");
        //console.dir(docs);
        callback(docs);
    });
};
*/
