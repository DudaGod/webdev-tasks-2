'use strict';

require('chai').should();
const expect = require('chai').expect;
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const Multivarka = require('../src/multivarka');

let multivarka = new Multivarka();
const students = JSON.parse(fs.readFileSync('../students.json').toString());
const url = 'mongodb://localhost/urfu-2015';
const collectionName = 'students';

let groupName = 'ПИ-301';
let gradeNum = 5;
let groupNames = ['ПИ-301', 'ПИ-302', 'КБ-301'];

describe('Multivarka interface', function () {
    before('delete the collection from db', function (done) {
        MongoClient
            .connect(url)
            .then(db => {
                db.collection(collectionName).drop();
                db.close();
            })
            .then(done, done);
    });

    before(function () {
        multivarka
            .server(url)
            .collection(collectionName);
    });

    it('should insert all students', function (done) {
        multivarka
            .insert(students)
                .then(actual => {
                    actual.insertedCount.should.be.equal(students.length);
                })
                .then(done, done);
    });

    it('should find students from group ' + groupName, function (done) {
        multivarka
            .where('group').equal(groupName)
            .find()
                .then(actual => {
                    const expectedCount = students.filter(item => item.group === groupName).length;
                    actual.length.should.be.equal(expectedCount);
                    actual.forEach(item => {
                        expect(item).to.include.keys('group');
                        expect(item['group']).to.contain(groupName);
                    });
                })
                .then(done, done);
    });

    it('should find students NOT from group ' + groupName, function (done) {
        multivarka
            .where('group').not().equal(groupName)
            .find()
                .then(actual => {
                    const expectedCount = students.filter(item => item.group !== groupName).length;
                    actual.length.should.be.equal(expectedCount);
                    actual.forEach(item => {
                        expect(item).to.include.keys('group');
                        expect(item['group']).to.not.contain(groupName);
                    });
                })
                .then(done, done);
    });

    it('should find students who have grade less than ' + gradeNum, function (done) {
        multivarka
            .where('grade').lessThan(gradeNum)
            .find()
                .then(actual => {
                    const expectedCount = students.filter(item => item.grade < gradeNum).length;
                    actual.length.should.be.equal(expectedCount);
                    actual.forEach(item => {
                        expect(item).to.include.keys('grade');
                        expect(item['grade']).to.be.below(gradeNum);
                    });
                })
                .then(done, done);
    });

    it('should find students who have grade NOT less than ' + gradeNum, function (done) {
        multivarka
            .where('grade').not().lessThan(gradeNum)
            .find()
                .then(actual => {
                    const expectedCount = students.filter(item => !(item.grade < gradeNum)).length;
                    actual.length.should.be.equal(expectedCount);
                    actual.forEach(item => {
                        expect(item).to.include.keys('grade');
                        expect(item['grade']).to.not.be.below(gradeNum);
                    });
                })
                .then(done, done);
    });

    gradeNum = 2;

    it('should find students who have grade great than ' + gradeNum, function (done) {
        multivarka
            .where('grade').greatThan(gradeNum)
            .find()
                .then(actual => {
                    const expectedCount = students.filter(item => item.grade > gradeNum).length;
                    actual.length.should.be.equal(expectedCount);
                    actual.forEach(item => {
                        expect(item).to.include.keys('grade');
                        expect(item['grade']).to.be.above(gradeNum);
                    });
                })
                .then(done, done);
    });

    it('should find students who have grade NOT great than ' + gradeNum, function (done) {
        multivarka
            .where('grade').not().greatThan(gradeNum)
            .find()
                .then(actual => {
                    const expectedCount = students.filter(item => !(item.grade > gradeNum)).length;
                    actual.length.should.be.equal(expectedCount);
                    actual.forEach(item => {
                        expect(item).to.include.keys('grade');
                        expect(item['grade']).to.not.be.above(gradeNum);
                    });
                })
                .then(done, done);
    });

    it('should find students from these groups: ' + groupNames, function (done) {
        multivarka
            .where('group').include(groupNames)
            .find()
                .then(actual => {
                    const expectedCount = students.filter(item =>
                        (groupNames.indexOf(item.group) + 1)).length;
                    actual.length.should.be.equal(expectedCount);
                    actual.forEach(item => {
                        expect(item).to.include.keys('group');
                        expect(groupNames).to.include(item.group);
                    });
                })
                .then(done, done);
    });

    it('should find students NOT from these groups: ' + groupNames, function (done) {
        multivarka
            .where('group').not().include(groupNames)
            .find()
                .then(actual => {
                    const expectedCount = students.filter(item =>
                        !(groupNames.indexOf(item.group) + 1)).length;
                    actual.length.should.be.equal(expectedCount);
                    actual.forEach(item => {
                        expect(item).to.include.keys('group');
                        expect(groupNames).to.not.include(item.group);
                    });
                })
                .then(done, done);
    });

    groupName = 'ПИ-666';
    gradeNum = 1;

    it('should update student data', function (done) {
        multivarka
            .where('group').equal('ПИ-302')
            .setValue('group', groupName)
            .setValue('stage', gradeNum)
            .update(true)
                .then(actual => {
                    const expectedCount = students.filter(item =>
                        !(groupNames.indexOf(item.group) + 1)).length;
                    actual.length.should.be.equal(expectedCount);
                    actual.forEach(item => {
                        expect(item).to.include.keys('group');
                        expect(groupNames).to.not.include(item.group);
                    });
                })
                .then(done, done);
    });
});


