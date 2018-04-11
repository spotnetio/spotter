'use strict';

exports.inventory = {
	'0x0b97c9edca21e93a23d86ce771cec2ab300ba237': {
		'0x345ca3e014aaf5dca488057592ee47305d9b3e10': 11,
		'0x8f0483125fcb9aaaefa9209d8e9d7b9c8b9fb90f': 12,
		'0x9fbda871d559710256a2502a2517b794b482db40': 13,
		'0xf25186b5081ff5ce73482ad761db0eb0d25abfbf': 14,
	},
	setInventory: function(user, token, amount) {
		if (this[user] === undefined) {
			this[user] = {};
		} 
		this[user][token] = parseInt(amount);
	},
	addInventory: function(user, token, amount) {
		if (this[user] === undefined) {
			this[user] = {};
		} 
		if (this[user][token] === undefined) {
			this[user][token] = parseInt(amount);
		} 
		else {
			this[user][token] += parseInt(amount);
		}
	},
	removeInventory: function(user, token) {
		delete this[user][token]
	},
};

