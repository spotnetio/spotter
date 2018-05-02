var HDWalletProvider = require("truffle-hdwallet-provider");
var config = require("../../config/secrets.js").config;

const R = require('ramda');
const spotArtifact = require("../../../contracts/build/contracts/Spot.json");
const TruffleContract = require("truffle-contract");
const Web3 = require("web3");
const networkUrl = "https://ropsten.infura.io/";//"http://localhost:9545";
const provider = new HDWalletProvider(config["mnemonic"]["ropsten"], networkUrl+config["infura_apikey"]); //new Web3.providers.HttpProvider(networkUrl);
const web3 = new Web3(provider);
let defaultAccount;
web3.eth.getAccounts((error, result) =>{defaultAccount = result[0]; console.log(defaultAccount);})
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

let store = {};

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
		if(role == 'lender') {
			this.findLenderMatchAndLock(user, token);
		}
		else {
			this.findTraderMatchAndLock(user, token);
		}
	},

	async findTraderMatchAndLock(user, token) {
		let lenders = [];
		let amount = store[user][token]['trader'];
		let amountEther = Math.floor(amount*rate*(fee + margin)/1000000);
		for (let u in store) {
			for (let t in store[u]) {
				let traders = await deployedSpot.getTraders();
				let lockedTokens = await deployedSpot.getTokens();
				let traderIdx = traders.indexOf(user);
				if(traderIdx >= 0) {
					if (lockedTokens[traderIdx] == token) {
						lenders = await deployedSpot.getLenders(traderIdx);
					}
					else {
						traderIdx = -1;
					}
				}
				let x1Filled = Math.min(
					amount,
					store[u][t]['lender'] 
				);
				let etherFilled = Math.min(
					amountEther,
					Math.floor(
						store[u][t]['lender']
							*rate*(fee + margin)/1000000
					)
				);
				if (t == token && x1Filled > 0 && etherFilled > 0) {
					let lenderIdx = lenders.indexOf(u);
					console.log('LockTrader('+
						user+','+ 
						traderIdx+','+ 
						token+','+
						x1Filled+','+
						u+','+
						lenderIdx+','+
						rate+','+
						fee+','+
						margin+','+
						'{from: '+defaultAccount+', gas: 3000000})'
					);
					deployedSpot.Lock(
						user, 
						traderIdx, 
						token,
						x1Filled,
						u,
						lenderIdx,
						rate,
						fee,
						margin,
						{from: defaultAccount, gas: 3000000}
					);
					// subtract from inventory					
					store[user][token]['trader'] -= x1Filled;
					store[u][t]['lender'] -= x1Filled;
					amount -= x1Filled;
				}
			}
		}
	},

	async findLenderMatchAndLock(user, token) {
		let amount = store[user][token]['lender'];
		let amountEther = Math.floor(amount*rate*(fee + margin)/1000000);
		for (let u in store) {
			for (let t in store[u]) {
				let x1Filled = Math.min(
					amount,
					store[u][t]['trader'] 
				);
				let etherFilled = Math.min(
					amountEther,
					Math.floor(
						store[u][t]['trader']
							*rate*(fee + margin)/1000000
					)
				);
				if (t == token && x1Filled > 0 && etherFilled > 0) {
					let traders = await deployedSpot.getTraders();
					let lockedTokens = await deployedSpot.getTokens();
					let lenders = [];
					let traderIdx = traders.indexOf(u);
					if(traderIdx >= 0) {
						if (lockedTokens[traderIdx] == token) {
							lenders = await deployedSpot.getLenders(traderIdx);
						}
						else {
							traderIdx = -1;
						}
					}
					let lenderIdx = lenders.indexOf(user);
					console.log('LockLender('+
						u+','+ 
						traderIdx+','+ 
						token+','+
						x1Filled+','+
						user+','+
						lenderIdx+','+
						rate+','+
						fee+','+
						margin+','+
						'{from: '+defaultAccount+', gas: 3000000})'
					);
					deployedSpot.Lock(
						u, 
						traderIdx, 
						token,
						x1Filled,
						user,
						lenderIdx,
						rate,
						fee,
						margin,
						{from: defaultAccount, gas: 3000000}
					);
					// subtract from inventory					
					store[user][token]['lender'] -= x1Filled;
					store[u][t]['trader'] -= x1Filled;
					amount -= x1Filled;
				}
			}
		}
	},

	async recall(lender, token, amount) {
		if(lender in store 
			&& token in store[lender] 
			&& 'lender' in store[lender][token]) {
			let minAmt = Math.min(
				store[lender][token]['lender'],
				amount
			);
			store[lender][token]['lender'] -= minAmt;
			amount -= minAmt;
			if (amount == 0) return;
		}
		let tradersTokens = {};
		let tradersLenders = {};
		let lenderCoordinates = [];
		let traders = await deployedSpot.getTraders();
		let tokens = await deployedSpot.getTokens();
		let amtTemp = amount;
MainLoop:
		for (let [i, t] of traders.entries()) {
			if (amtTemp <= 0) {break;}
			tradersTokens[t+tokens[i]]=i;
			let lenders = await deployedSpot.getLenders(i);
			tradersLenders[i] = lenders;
			for (let [j, l] of lenders.entries()) {
				if (amtTemp <= 0) {break MainLoop;}
				if (l == lender && tokens[i] == token) {
					let amtLocked = await deployedSpot.getAmount(i,j);
					let amtMin = Math.min(amtLocked, amtTemp);
					lenderCoordinates.push([i,j,amtMin]); // lender coordinates & amount
					amtTemp -= amtMin;
				}
			}
		}

		let borrTokIdx = [];
		let lenderIdx = [];
		let newLender = [];
		let newLenderIdx = [];
		let amts = [];
		for (let u in store) {
			for (let t in store[u]) {
				if (t == token) {
					for (let [i,lockedLender] of lenderCoordinates.entries()) {
						let swapAmount = Math.min(
							parseInt(store[u][t]['lender']), 
							parseInt(lockedLender[2])
						);
						if (swapAmount > 0) {
							borrTokIdx.push(lockedLender[0]);
							lenderIdx.push(lockedLender[1]);
							newLender.push(u);
							newLenderIdx.push(tradersLenders[lockedLender[0]].indexOf(u));
							amts.push(swapAmount);
							store[u][t]['lender'] -= swapAmount;
							lockedLender[2] -= swapAmount
						}
					}
				}
			}
		}
		console.log('Swap('+
			JSON.stringify(borrTokIdx)+','+
			JSON.stringify(lenderIdx)+','+
			JSON.stringify(newLender)+','+
			JSON.stringify(newLenderIdx)+','+
			JSON.stringify(amts)+')');
		deployedSpot.Swap(
			borrTokIdx,
			lenderIdx,
			newLender,
			newLenderIdx,
			amts,
			{from: defaultAccount, gas: 3000000}
		);

		deployedSpot.Swapped({fromBlock:'latest'},{}).watch(function(err, evnt) {
			if (!err) {
				lenderCoordinates = lenderCoordinates.filter(x => x[2] > 0);
				if(R.sum(lenderCoordinates.map(x => x[2])) > 0) {
					let b = lenderCoordinates.map(x => x[0]);
					let l = lenderCoordinates.map(x => x[1]);
					let a = lenderCoordinates.map(x => x[2]);
					console.log('Recall('+
						JSON.stringify(b)+','+
						JSON.stringify(l)+','+
						JSON.stringify(a)+')');
					deployedSpot.Recall(
						b,
						l,
						a,
						{from: defaultAccount, gas: 3000000}
					);
				}
			} else {
				console.error(err);
			}
		});
	},

	async b2c(trader, token, amount) {
		if(trader in store 
			&& token in store[trader] 
			&& 'trader' in store[trader][token]) {
			let minAmt = Math.min(
				store[trader][token]['trader'],
				amount
			);
			store[trader][token]['trader'] -= minAmt;
			amount -= minAmt;
			if (amount == 0) return;
		}
		let lenderList = [];
		let amountList = [];
		let tokens = await deployedSpot.getTokens();
		let traders = await deployedSpot.getTraders();
		let traderIdx = traders.map((x,i) => x==trader && tokens[i]==token ? i : '').filter(String);
		let lndrs = await deployedSpot.getLenders(traderIdx);
		let amtTemp = amount;

		for (let [j, l] of lndrs.entries()) {
			if (amtTemp <= 0) { break; }
			let amtLocked = await deployedSpot.getAmount(traderIdx,j);
			let amtMin = Math.min(amtLocked, amtTemp);
			lenderList.push(j); // lender coordinates 
			amountList.push(amtMin); // lender amount
			amtTemp -= amtMin;
		}
		console.log('BuyToCover('+
			JSON.stringify(traderIdx)+','+
			JSON.stringify(lenderList)+','+
			JSON.stringify(amountList)+','+
			JSON.stringify(amount)+','+
			JSON.stringify(rate)+','+
			JSON.stringify(fee)+','+
			JSON.stringify(margin)+')');
		deployedSpot.BuyToCover(
			traderIdx,
			lenderList,
			amountList,
			amount,
			rate,
			fee,
			margin,
			{from: defaultAccount, gas: 3000000}
		);
	}
};
