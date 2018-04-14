'use strict';

const spotArtifact = require("../../../contracts/build/contracts/Spot.json");
const TruffleContract = require("truffle-contract");
const Web3 = require("web3");
const networkUrl = "http://localhost:9545";
const provider = new Web3.providers.HttpProvider(networkUrl);
const web3 = new Web3(provider);
// get the contract artifact file and use it to instantiate a truffle contract abstraction
let spotContract = TruffleContract(spotArtifact);
// set the provider for our contracts
spotContract.setProvider(provider);
// Save instance	
let deployedSpot;
spotContract.deployed().then(function(inst) {
	deployedSpot = inst;
});

// Oracle params
const 	rate = 100;		// times 100
const 	fee = 0;		// basis (10000)
const 	margin = 10000;	// basis

let store = {
	// 'user': {
	// 	'token1': {
	// 		'lender': 1,
	// 		'trader': 2,
	// 	},
	// 	'token2': {
	// 		'lender': 3,
	// 		'trader': 4,
	// 	},
	// },
};

exports.inventory = {
	getStore: function() {
		return store;
	},
	addInventory: function(user, token, amount, role) {
		// console.log('addInventory amount '+amount);
		let counterpartRole = role == 'lender' ? 'trader' : 'lender';
		if (store[user] === undefined) {
			store[user] = {};
		} 
		if (store[user][token] === undefined) {
			store[user][token] = {};
			store[user][token][role] = parseInt(amount);
			store[user][token][counterpartRole] = 0;
		} 
		else {
			store[user][token][role] += parseInt(amount);
		}
		// console.log('store[user][token][role] '+store[user][token][role]);
		this.findMatchAndLock(user, token, role, counterpartRole);
	},

	findMatchAndLock(user, token, role, counterpartRole) {
		let amount = store[user][token][role];
		// console.log('amount '+amount);
		let amountEther = Math.floor(amount*rate*(fee + margin)/1000000);
		for (let u in store) {
			for (let t in store[u]) {
				amount = store[user][token][role];
				if (amount == 0){
					return;
					// console.log('store1 '+JSON.stringify(store));
				}
				// Amounts of X1 and ether to be filled on this pass
				let x1Filled = Math.min(
					amount,
					store[u][t][counterpartRole] 
				);
				// console.log('amountEther '+amountEther);
				// console.log('store[u][t][counterpartRole] '+store[u][t][counterpartRole]);
				let etherFilled = Math.min(
					amountEther,
					Math.floor(
						store[u][t][counterpartRole]
							*rate*(fee + margin)/1000000
					)
				);
				// console.log('x1Filled '+x1Filled);
				// console.log('etherFilled '+etherFilled);
				// console.log('deployedSpot.address '+deployedSpot.address);
				if (t == token && x1Filled > 0 && etherFilled > 0) {
					// call lock
					if(role == 'lender') {
						console.log('lenderLock('+
							user+','+ 
							u+',' +
							token+','+
							etherFilled+','+
							rate+','+
							fee+','+
							margin+')'
						);
						deployedSpot.Lock(
							user, 
							u, 
							token,
							etherFilled,
							rate,
							fee,
							margin,
							{from: web3.eth.accounts[0], gas: 3000000}
						);
					}
					else {
						console.log('traderLock('+
							u+',' +
							user+','+ 
							token+','+
							etherFilled+','+
							rate+','+
							fee+','+
							margin+')'
						);
						deployedSpot.Lock(
							u, 
							user, 
							token,
							amountEther,
							rate,
							fee,
							margin,
							{from: web3.eth.accounts[0], gas: 3000000}
						);						
					}
					// subtract from inventory					
					store[user][token][role] -= x1Filled;
					store[u][t][counterpartRole] -= x1Filled;
				}
			}
		}
		// console.log('store2 '+JSON.stringify(store));
	}
};

