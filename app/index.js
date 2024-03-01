'use strict';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { NodejsClient } from 'contensis-management-api/lib/client/nodejs-client.js';
import path from 'path';
import { fileURLToPath } from 'url';
//import {} from 'dotenv/config';

// Set some variables.
const CT = 'electionresults';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../public');
const port = 3001;
const ROOT_URL = `https://cms-chesheast.cloud.contensis.com/`;
const PROJECT = process.env.projectId;
const client = NodejsClient.create({
  clientType: 'client_credentials',
  clientDetails: {
    clientId: process.env.CONTENSIS_CLIENT_ID,
    clientSecret: process.env.CONTENSIS_CLIENT_SECRET,
  },
  projectId: PROJECT,
  rootUrl: ROOT_URL,
});

async function sendEntry(entry, res) {
  client.entries
    .create(entry)
    .then((result) => {
      setTimeout(() => publishEntry(result, res), 500);
    })
    .catch((error) => {
      console.log(error.data);
      res.status(400).send();
    });
}

async function updateEntry(entry, res) {
  client.entries
    .update(entry)
    .then((result) => {
      setTimeout(() => publishEntry(result, res), 500);
    })
    .catch((error) => {
      console.log(error.data);
      res.status(400).send();
    });
}

async function publishEntry(entry, res) {
  client.entries
    .invokeWorkflow(entry, 'draft.publish')
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      console.log(error.data);
      res.status(400).send();
    });
}

const Cand = function (c) {
  this.id = c.ID;
  this.candidateName = c.CandidateName;
  this.partyId = c.Party_ID;
  this.wardName = c.WardName;
  this.partyName = c.PartyName;
  this.wardCode = c.WardCode;
  this.votes = c.Votes;
  this.wonSeat = c.WonSeat == '1';
};

const Party = function (p) {
  this.id = p.ID;
  this.partyName = p.PartyName;
  this.partyHexColour = p.PartyHexColour;
  this.partyFontHexColour = p.PartyHexFontColour;
  this.majorParty = p.MajorParty === 1;
  this.openElectionDataPartyId = p.OpenElectionDataPartyId;
};

const Ward = function (w) {
  this.wardCode = w.WardCode;
  this.wardName = w.WardName;
  this.candidates = w.Candidates;
  this.ballotPapersRejected = w.BallotPapersRejected;
  this.turnout = w.Turnout;
};

const Election = function (d, c, p, w, sys = undefined) {
  this.date = d;
  this.title = `Election results: ${d.toLocaleDateString()}`;
  this.electionParty = p.map((e) => new Party(e));
  this.electionCandidate = c.map((e) => new Cand(e));
  this.electionWard = w.map((e) => new Ward(e));
  this.sys = sys || {
    id: uuidv4(),
    slug: this.title.replace(/:?\s|\//g, '-').toLowerCase(),
    contentTypeId: CT,
    projectId: 'website',
    language: 'en-GB',
    dataFormat: 'entry',
  };
};

async function getEntries() {
  let res = await client.entries
    .list({
      contentTypeId: CT,
      pageOptions: {
        pageSize: 500,
      },
    })
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log(error);
      return [];
    });
  return res;
}

// Start the server.
const app = express();
app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});

// Log all requests to the server
const myLogger = function (req, _, next) {
  console.log(`Incoming: ${req.url}`);
  next();
};

// Middleware
app.use(express.json({ limit: '200kb' }));
//app.use(express.static('public'));
app.use(cors());
app.use(myLogger);

// Route

app.post('/', async function (req, res) {
  if (req.body.pwd === 'z') {
    res.status(403).send();
  }
  if (req.body.action === 'login') {
    getEntries().then((entries) => {
      res.json(entries);
    });
  } else if (req.body.action === 'update') {
    let entry = new Election(
      new Date(req.body.date),
      req.body.cands,
      req.body.parties,
      req.body.wards,
      req.body.update.sys,
    );
    updateEntry(entry, res);
  } else {
    let entry = new Election(
      new Date(req.body.date),
      req.body.cands,
      req.body.parties,
      req.body.wards,
    );
    sendEntry(entry, res);
  }
});

app.use('*', function (req, res) {
  res.sendFile(path.join(dir, 'index.html'));
});
