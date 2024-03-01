'use strict';
import { v4 as uuidv4 } from 'uuid';
import { NodejsClient } from 'contensis-management-api/lib/client/nodejs-client.js';
import fs from 'fs';

// Set some variables.
const ROOT_URL = `https://cms-${process.env.alias}.cloud.contensis.com/`;
const PROJECT = process.env.projectId;
import {} from 'dotenv/config';

const CT = 'electionResults';

const client = NodejsClient.create({
  clientType: 'client_credentials',
  clientDetails: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.SHARED_SECRET,
  },
  projectId: PROJECT,
  rootUrl: ROOT_URL,
});

const sendEntry = (entry) => {
  client.entries
    .create(entry)
    .then((result) => {
      console.log('Success');
    })
    .catch((error) => {
      console.log(entry.partyName);
      console.log(error.data);
    });
};

const Cand = function (c) {
  console.log(c);
  let arr = c.split(',');
  this.id = arr[0];
  this.candidateName = `${arr[1]}, ${arr[2].trim()}`;
  this.partyId = arr[3];
  this.wardCode = arr[4];
  this.votes = arr[5];
  this.wonSeat = arr[6] === '1';
};

const Party = function (p) {
  let arr = p.split(',');
  this.id = arr[0];
  this.partyName = arr[1];
  this.partyHexColour = arr[2];
  this.partyFontHexColour = arr[3];
  this.majorParty = arr[4] === '1';
  this.openElectionDataPartyId = arr[6];
};

const Ward = function (w) {
  let arr = w.split(',');
  this.wardCode = arr[0];
  this.wardName = arr[1];
  this.candidates = arr[2];
  this.ballotPapersRejected = arr[5];
  this.turnout = arr[6];
};

const Election = function (d, cat, p, c, w) {
  this.date = d;
  this.category = cat;
  this.title = `Election results: ${d.toLocaleDateString()}`;
  this.electionParty = p.map((e) => new Party(e));
  this.electionCandidate = c.map((e) => new Cand(e));
  this.electionWard = w.map((e) => new Ward(e));
  this.sys = {
    id: uuidv4(),
    slug: this.title.replace(/:?\s|\//g, '-').toLowerCase(),
    contentTypeId: CT,
    projectId: 'website',
    language: 'en-GB',
    dataFormat: 'entry',
  };
};

const d = new Date("2023/05/04");
const cat = 'Council';
const p = fs
  .readFileSync('./party.csv')
  .toString()
  .split('\n')
  .filter((e) => e.length)
  .slice(1);
const c = fs
  .readFileSync('./cand.csv')
  .toString()
  .split('\n')
  .filter((e) => e.length)
  .slice(1);
const w = fs
  .readFileSync('./ward.csv')
  .toString()
  .split('\n')
  .filter((e) => e.length)
  .slice(1);

const entry = new Election(d, cat, p, c, w);
console.log(entry.sys.slug);
//sendEntry(entry);
