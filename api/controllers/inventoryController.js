'use strict';

var db = require('../model/db');

exports.list_inventory = function(req, res) {
	res.json(db.inventory);
};