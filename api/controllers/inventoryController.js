'use strict';

var db = require('../model/db');
var CORS = 'http://localhost:8000';

exports.list_inventory = function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', CORS);
	res.json(db.inventory[req.params.userId]);
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