"use strict";

const fs = require("fs");
const path = require("path");
const chai = require("chai");
const parsePubSuffixList = require("../lib/tries/parsePubSuffixList");
const serializeTrie = require("../lib/tries/serializeTrie");
const parseTrie = require("../lib/tries/parseTrie");
const lookUp = require("../lib/tries/lookUp");

const expect = chai.expect;
const TEST_SNAPSHOT = true;
const pathToFixtures = path.resolve(__dirname, "fixtures");
const pathToSnapshots = path.resolve(__dirname, "snapshots");
const pathToParsePubSuffixListSnapshot = path.resolve(pathToSnapshots, "parsePubSuffixList.json");
const pathToSerializeTrieSnapshot = path.resolve(pathToSnapshots, "serializeTrie.json");

describe("snapshots", () => {
    describe("parsePubSuffixList()", () => {
        it("matches the approved snapshot", () => {
            const pubSuffixList = fs.readFileSync(path.resolve(pathToFixtures, "pubSuffixList.txt"), "utf8");
            const parsedList = parsePubSuffixList(pubSuffixList);
            const snapshot = JSON.parse(fs.readFileSync(pathToParsePubSuffixListSnapshot, "utf8"));

            TEST_SNAPSHOT && expect(parsedList).to.eql(snapshot);
            fs.writeFileSync(pathToParsePubSuffixListSnapshot, JSON.stringify(parsedList));
        });
    });
    describe("serializeTrie()", () => {
        it("matches the approved snapshot", () => {
            const parsedList = JSON.parse(fs.readFileSync(pathToParsePubSuffixListSnapshot, "utf8"));
            const snapshot = JSON.parse(fs.readFileSync(pathToSerializeTrieSnapshot, "utf8"));
            const serializedTrie = serializeTrie(parsedList.icann);

            TEST_SNAPSHOT && expect(serializedTrie).to.eql(snapshot);
            fs.writeFileSync(pathToSerializeTrieSnapshot, JSON.stringify(serializedTrie));
        });
    });
    describe("parseTrie() and lookUp() calling lookUp() with the result from parseTrie(snapshot) and hostname", () => {
        const serializedTrie = JSON.parse(fs.readFileSync(pathToSerializeTrieSnapshot, "utf8"));
        const parsedTrie = parseTrie(serializedTrie);

        [
            ["example.com", "com"],
            ["example.a.com", "com"],
            ["example.uk", "uk"],
            ["example.co.uk", "co.uk"],
            ["example.ab.uk", "uk"],
        ].forEach(testArgs => {
            const hostname = testArgs[0];
            const expectedResult = testArgs[1];

            it(`'${hostname}' returns ${expectedResult}`, () => {
                expect(lookUp(parsedTrie, hostname)).to.equal(expectedResult);
            });
        });
    });
});
