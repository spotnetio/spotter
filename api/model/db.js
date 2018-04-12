'use strict';

exports.inventory = {
	'user': {
		'token1': {
			'lender': 1,
			'trader': 2,
		},
		'token2': {
			'lender': 3,
			'trader': 4,
		},
	},
	addInventory: function(user, token, amount, role) {
		if (this[user] === undefined) {
			this[user] = {};
		} 
		if (this[user][token] === undefined) {
			this[user][token] = {};
			this[user][token][role] = parseInt(amount);
		} 
		else {
			this[user][token][role] += parseInt(amount);
		}
		console.log(this);
	},
	// removeInventory: function(user, token) {
	// 	delete this[user][token]
	// },
};

