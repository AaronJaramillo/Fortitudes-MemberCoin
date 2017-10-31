const FortitudeRanchCrowdsale = artifacts.require("./FortitudeRanchCrowdsale.sol");

module.exports = function(deployer, accounts) {
	const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1;
	const endTime = startTime + (86400 * 20);
	const rate = new web3.BigNumber(3);
	const  wallet = '0xbfd09d05ebb864f75dcc28fe026ac0f3dcd11ade';

	deployer.deploy(FortitudeRanchCrowdsale, startTime, endTime, rate, wallet);
};

