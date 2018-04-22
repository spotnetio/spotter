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
		let traders = await deployedSpot.getTraders();
		let lockedTokens = await deployedSpot.getTokens();
		let amount = store[user][token]['trader'];
		let amountEther = Math.floor(amount*rate*(fee + margin)/1000000);
		let traderIdx = traders.indexOf(user);
		if(traderIdx >= 0) {
			if (lockedTokens[traderIdx] == token) {
				lenders = await deployedSpot.getLenders(traderIdx);
			}
			else {
				traderIdx = -1;
			}
		}
		for (let u in store) {
			for (let t in store[u]) {
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
						'{from: '+web3.eth.accounts[0]+', gas: 3000000})'
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
						{from: web3.eth.accounts[0], gas: 3000000}
					);
					// subtract from inventory					
					store[user][token]['trader'] -= x1Filled;
					store[u][t]['lender'] -= x1Filled;
				}
			}
		}
	},

	async findLenderMatchAndLock(user, token) {
		let amount = store[user][token]['lender'];
		let amountEther = Math.floor(amount*rate*(fee + margin)/1000000);
		let traders = await deployedSpot.getTraders();
		let lockedTokens = await deployedSpot.getTokens();
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
						'{from: '+web3.eth.accounts[0]+', gas: 3000000})'
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
						{from: web3.eth.accounts[0], gas: 3000000}
					);
					// subtract from inventory					
					store[user][token]['lender'] -= x1Filled;
					store[u][t]['trader'] -= x1Filled;
				}
			}
		}
	},

	async recall(lender, token, amount) {
		let tradersTokens = {};
		let lendersTokens = {};
        let traders = await App.vaultDeployed.getTraders();
        let tokens = await App.vaultDeployed.getTokens();
        traders.forEach(async function (t, i) {
          tradersTokens[t+tokens[i]]=i;
          let lenders = await App.vaultDeployed.getLenders(i);
          lenders.forEach(function (l, j) {
          	if (l == lender && tokens[i] == token) {
           		lendersTokens[i+','+j]=await App.vaultDeployed.getAmount(i,j);
            }
          });
        });

		lenders = [];
		amounts = [];
loop1:
		for (let u in store) {
			for (let t in store[u]) {
				swapAmount = Math.min(
					store[u][t]['lender'], 
					amount
				);
				if (t == token && swapAmount > 0) {
					lenders.push(u);
					amounts.push(swapAmount);
					store[u][t]['lender'] -= swapAmount;
					amount -= swapAmount
					if (amount <= 0) {
						break loop1;
					}
				}
			}
		}
		deployedSpot.Swap(
			lender,
			token,
			lenders,
			amounts,
			rate, 
			fee,
			margin
		);

		if (amount > 0) {
			let borrowers, amounts = deployedSpot.Recall(
				lender,
				token,
				amount
			);
			for (let i=0; i<borrowers.length; i++) {
				store[borrowers[i]][token]['lender'] += amounts[i];
			}
		}
	}
};

