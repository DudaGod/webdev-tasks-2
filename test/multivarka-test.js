'use strict';

require('chai').should();
const expect = require('chai').expect;
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const Multivarka = require('../src/multivarka');

const mocha = require('mocha');
const coMocha = require('co-mocha');
coMocha(mocha);

let multivarka = new Multivarka();
const jsonDir = path.join(__dirname, '..', 'students.json');
const students = require(jsonDir);
const url = 'mongodb://urfu2015:footprint@ds054128.mlab.com:54128/urfu-2015';
const collectionName = 'students';

let groupName = 'ПИ-301';
let grade = 5;
let grade2 = 3;
let groupNames = ['ПИ-301', 'ПИ-302', 'КБ-301'];

describe('Multivarka interface', () => {
    before('delete the collection from db', function *() {
        const db = yield MongoClient.connect(url);
        db.collection(collectionName).drop();
        db.close();
        multivarka.server(url)
            .collection(collectionName);
    });

    it('should insert all students', function *() {
        const actual = yield multivarka.insert(students);
        actual.insertedCount.should.be.equal(students.length);
    });

    it(`should find students with grade greater ${grade2} and lower ${grade}`, function *() {
        const actual = yield multivarka.where('grade')
            .greatThan(grade2)
            .where('grade')
            .lessThan(grade)
            .find();
        const expectedCount = students
            .filter(item => (item.grade > grade2 && item.grade < grade))
            .length;
        actual.length.should.be.equal(expectedCount);
        actual.forEach(item => {
            expect(item).to.include.keys('grade');
            expect(item['grade']).to.be.below(grade);
            expect(item['grade']).to.be.above(grade2);
        });
    });

    it('should find students from group ' + groupName, function *() {
        const actual = yield multivarka.where('group')
            .equal(groupName)
            .find();
        const expectedCount = students.filter(item => item.group === groupName).length;
        actual.length.should.be.equal(expectedCount);
        actual.forEach(item => {
            expect(item).to.include.keys('group');
            expect(item['group']).to.equal(groupName);
        });
    });

    it('should find students NOT from group ' + groupName, function *() {
        const actual = yield multivarka.where('group')
            .not().equal(groupName)
            .find();
        const expectedCount = students.filter(item => item.group !== groupName).length;
        actual.length.should.be.equal(expectedCount);
        actual.forEach(item => {
            expect(item).to.include.keys('group');
            expect(item['group']).to.not.contain(groupName);
        });
    });

    it('should find students who have grade less than ' + grade, function *() {
        const actual = yield multivarka.where('grade')
            .lessThan(grade)
            .find();
        const expectedCount = students.filter(item => item.grade < grade).length;
        actual.length.should.be.equal(expectedCount);
        actual.forEach(item => {
            expect(item).to.include.keys('grade');
            expect(item['grade']).to.be.below(grade);
        });
    });

    it('should find students who have grade NOT less than ' + grade, function *() {
        const actual = yield multivarka.where('grade')
            .not()
            .lessThan(grade)
            .find();
        const expectedCount = students.filter(item => !(item.grade < grade)).length;
        actual.length.should.be.equal(expectedCount);
        actual.forEach(item => {
            expect(item).to.include.keys('grade');
            expect(item['grade']).to.not.be.below(grade);
        });
    });

    it('should find students who have grade great than ' + grade, function *() {
        grade = 2;
        const actual = yield multivarka.where('grade')
            .greatThan(grade)
            .find();
        const expectedCount = students.filter(item => item.grade > grade).length;
        actual.length.should.be.equal(expectedCount);
        actual.forEach(item => {
            expect(item).to.include.keys('grade');
            expect(item['grade']).to.be.above(grade);
        });
    });

    it('should find students who have grade NOT great than ' + grade, function *() {
        const actual = yield multivarka.where('grade')
            .not()
            .greatThan(grade)
            .find();
        const expectedCount = students.filter(item => !(item.grade > grade)).length;
        actual.length.should.be.equal(expectedCount);
        actual.forEach(item => {
            expect(item).to.include.keys('grade');
            expect(item['grade']).to.not.be.above(grade);
        });
    });

    it('should find students from these groups: ' + groupNames, function *() {
        const actual = yield multivarka.where('group')
            .include(groupNames)
            .find();
        const expectedCount = students.filter(item =>
            (groupNames.indexOf(item.group) + 1)).length;
        actual.length.should.be.equal(expectedCount);
        actual.forEach(item => {
            expect(item).to.include.keys('group');
            expect(groupNames).to.include(item.group);
        });
    });

    it('should find students NOT from these groups: ' + groupNames, function *() {
        const actual = yield multivarka.where('group')
            .not()
            .include(groupNames)
            .find();
        const expectedCount = students.filter(item =>
            !(groupNames.indexOf(item.group) + 1)).length;
        actual.length.should.be.equal(expectedCount);
        actual.forEach(item => {
            expect(item).to.include.keys('group');
            expect(groupNames).to.not.include(item.group);
        });
    });

    it('should update data of a student', function *() {
        groupName = 'ПИ-666';
        grade = 1;
        const actual = yield multivarka.where('group')
            .equal('ПИ-302')
            .setValue('group', groupName)
            .setValue('stage', grade)
            .update(true);
        const expectedCount = students.filter(item => item.group === 'ПИ-302').length;
        actual.modifiedCount.should.be.equal(expectedCount);
    });

    it('should remove data of a student', function *() {
        grade = 5;
        const actual = yield multivarka.where('grade')
            .equal(grade)
            .remove(true);
        const expectedCount = students.filter(item => item.grade === grade).length;
        actual.deletedCount.should.be.equal(expectedCount);
    });
});


