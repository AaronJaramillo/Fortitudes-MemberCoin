const FortitudeRanchCrowdsale = artifacts.require("./FortitudeRanchCrowdsale.sol");
const fortitude = artifacts.require("fortitude.sol");

module.exports = function(deployer, accounts) {
	const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 300;
	const endTime = startTime + (86400 * 20);
	const rate = new web3.BigNumber(3000000000000000000);
	const  wallet = '0x77388542743175D705Cb70392F8c41C35CaE66c7';
	return deployer.deploy(fortitude).then(function() {
		return deployer.deploy(FortitudeRanchCrowdsale, startTime, endTime, rate, wallet, fortitude.address).then(function() {
			fortitude.transferOwnership(FortitudeRanchCrowdsale.address);
		});
	});

};

