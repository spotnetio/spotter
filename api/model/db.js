'use strict';

exports.inventory = {
	'X0': {
		'0x0': 0,
	},
	setInventory: function(token, lender, amount) {
		if (this[token] === undefined) {
			this[token] = {};
		} 
		this[token][lender] = amount;
	},
	addInventory: function(token, lender, amount) {
		if (this[token] === undefined) {
			this[token] = {};
		} 
		if (this[token][lender] === undefined) {
			this[token][lender] = amount;
		} 
		else {
			this[token][lender] += amount;
		}
	},
	removeInventory: function(token, lender) {
		delete this[token][lender];
	},
};

