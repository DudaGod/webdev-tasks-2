'use strict';

const MongoClient = require('mongodb').MongoClient;
const co = require('co');

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
        if (!(/^mongodb:\/\/.+/i.test(this._url))) {
            throw new RangeError('Incorrect url, url should be determined like - ' +
                'mongodb://localhost/...');
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
    remove: function (isMany) {
        return this._connect(col => {
            return isMany ? col.deleteMany(this._query) : col.deleteOne(this._query);
        });
    },
    _initQuery: function (value) {
        if (!this._field) {
            throw new ReferenceError('You should call a where method with field name, ' +
                'before your query method');
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
        return co(function *() {
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
};

module.exports = Multivarka;
