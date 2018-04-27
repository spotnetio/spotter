'use strict';
import { getContracts } from "../../contracts";

var db = require('../model/db');
var CORS = '*';// 'http://localhost:8000';
let TOKENS_LIST = [
	'EosToken', 
	'VenToken',
  	'WethToken'
];

exports.tokens = function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', CORS);
	let token = req.params.token;
	let contracts = getContracts();
	if (token == null) {
		let result = {};
		for(let c in contracts) {
			if (TOKENS_LIST.includes(c)) {
				result[c] = contracts[c];
			}
		}
		res.json(result);
	}
	else {
		res.json(contracts[token]);
	}
};

exports.contracts = function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', CORS);
	let id = req.params.id;
	let contracts = getContracts();
	if (id == null) {
		res.json(contracts);
	}
	else {
		res.json(contracts[id]);
	}
};

exports.list_inventory = function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', CORS);
	let userId = req.params.userId;
	if (userId == null) {
		res.json(db.inventory.getStore());
	}
	else if (!(userId in db.inventory.getStore())) {
		res.json({});
	}
	else {
		res.json(db.inventory.getStore()[userId]);
	}
};

exports.add_inventory = function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', CORS);
	res.json(db.inventory.addInventory(
		req.params.userId,
		req.body.token,
		req.body.amount,
		req.body.role,
	));
};

exports.recall = function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', CORS);
	res.json(db.inventory.recall(
		req.params.userId,
		req.body.token,
		req.body.amount,
	));
};

exports.b2c = function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', CORS);
	res.json(db.inventory.b2c(
		req.params.userId,
		req.body.token,
		req.body.amount,
	));
};