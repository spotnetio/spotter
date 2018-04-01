var Web3 = require('web3');
const util = require('util');
var db = require('../model/db');

const hostname = '127.0.0.1';
const port = 3001;
var ipcLocation = '/Users/marat/Library/Ethereum/geth.ipc';
var abiLocation = '/Users/marat/work/spottoken/spot/build/contracts/X1Token.json';
var x1TokenContractAddress = '0x09fd9af51ddae8419703a1ce3e544c05cbea3846';
var spotContractAddress = '0x85e72b0a1ff3e7bd30510e6af47f56ea08c08081';

function log(s) {
	console.log(s);
}

var net = require('net');
var provider = new Web3.providers.IpcProvider(
	ipcLocation, net
);
var web3 = new Web3(provider, net);
web3.eth.getAccounts(function(err, accounts) {
	log(accounts);
});

var abi = require(abiLocation).abi;
var X1TokenContract = web3.eth.contract(abi);
var X1Token = X1TokenContract.at(x1TokenContractAddress);

// Register events
X1Token.Approval(
	{spender: spotContractAddress}, 
	{}
).watch(function(error, event) {
	if (!error) {
		db.inventory.setInventory(
			X1Token.address, 
			event.args.owner, 
			event.args.value.toNumber()
		);
		console.log(
			"Approval event " + util.inspect(
				event, 
				{ showHidden: true, depth: null }
		));
	} else {
		console.error(error);
	}
});
