'use strict';

const MongoClient = require('mongodb').MongoClient;
const co = require('co');

function Multivarka() {
    this._url = '';
    this._collectionName = '';
    this._db = '';
    this._dbCollection = '';
    this._reset();
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
            const options = isUpsert ? {upsert: true} : {};
            return isMany ? col.updateMany(this._query, this._set, options) :
                col.updateOne(this._query, this._set);
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
        if (Object.keys(this._query).length) {
            let furtherQuery = {};
            furtherQuery[this._field] = value;
            this._query.hasOwnProperty('$and') ? this._query['$and'].push(furtherQuery) :
                () => {
                    let arr = [this._query];
                    arr.push(furtherQuery);
                    this._query = {$and: arr};
                }();
        } else {
            this._query[this._field] = value;
        }
        return this;
    },
    _reset: function () {
        this._field = '';
        this._isNegative = false;
        this._query = {};
        this._set = {$set: {}};
    },
    _connect: function (crudFunc) {
        return co(function *() {
            if (!this._db) {
                this._db = yield MongoClient.connect(this._url);
                this._dbCollection = this._db.collection(this._collectionName);
            }
            const result = yield crudFunc(this._dbCollection);
            this._reset();
            return result;
        }.bind(this));
    }
};

module.exports = Multivarka;
