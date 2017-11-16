import ether from './helpers/ether'
import EVMThrow from './helpers/EVMThrow'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'

const fortitude = artifacts.require("fortitude.sol");
const FortitudeRanchCrowdsale = artifacts.require("FortitudeRanchCrowdsale.sol");

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('FRT:Checks Contributions', function(accounts) {
	const rate = new BigNumber(3.5);
	const  wallet = accounts[1];
	const investor = accounts[0]
	beforeEach(async function () {
		this.startTime = latestTime() + duration.weeks(1);
		this.endTime = this.startTime + duration.weeks(1);
		this.afterEndTime = this.endTime + duration.seconds(10)

		this.crowdsale = await FortitudeRanchCrowdsale.new(this.startTime, this.endTime, ether(rate), wallet, {from: wallet});
		this.token = fortitude.at(await this.crowdsale.token());
	});

	it('should create contracts correctly', async function() {
		this.crowdsale.should.exist;
		this.token.should.exist;
		(await this.crowdsale.startTime()).should.be.bignumber.equal(this.startTime);
		(await this.crowdsale.endTime()).should.be.bignumber.equal(this.endTime);
		(await this.crowdsale.rate()).should.be.bignumber.equal(ether(rate));
		(await this.crowdsale.wallet()).should.be.equal(wallet);


	});
	it('should not accept payments before the start', async function() {
		await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMThrow);
		await this.crowdsale.buyTokens(accounts[1], {from: accounts[1], value: ether(1)}).should.be.rejectedWith(EVMThrow);
	});
	it('Should accept payments during sale at 20% Discount', async function () {
		const investmentAmount = ether(1);
		var expectedTokenAmount = rate.mul(1.2);
		expectedTokenAmount = expectedTokenAmount.mul(investmentAmount);

		await increaseTimeTo(this.startTime);
		await this.crowdsale.buyTokens(investor, {value: investmentAmount, from: investor}).should.be.fulfilled;

		(await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
		(await this.token.totalSupply()).should.be.bignumber.equal(expectedTokenAmount);
	});
	it('Should accept payments after 1 day at the standard rate', async function () {
		const investmentAmount = ether(1);
		const expectedTokenAmount = rate.mul(investmentAmount);

		await increaseTimeTo(this.startTime + duration.days(1));
		await this.crowdsale.send(investmentAmount, {from: investor}).should.be.fulfilled;

		(await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
		(await this.token.totalSupply()).should.be.bignumber.equal(expectedTokenAmount);

	});
	it('Should reject payments below the minimum of 0.1 ether', async function() {
		const investmentAmount = ether(0.09);
		await increaseTimeTo(this.startTime);
		await this.crowdsale.buyTokens(investor, {value: investmentAmount, from: investor}).should.be.rejectedWith(EVMThrow);


	})
	it('Should reject payments after end', async function () {
		await increaseTimeTo(this.afterEndTime);
		await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMThrow);
		await this.crowdsale.buyTokens(investor, {value: ether(1), from: investor}).should.be.rejectedWith(EVMThrow);
	});
	it('should finalize crowdsale', async function() {
		const investmentAmount = ether(10);
		await increaseTimeTo(this.startTime);
		await this.crowdsale.buyTokens(investor, {value: investmentAmount, from: investor}).should.be.fulfilled;

		const amountMinted = new BigNumber(await this.token.totalSupply());
		const expectedTokenAmount = amountMinted.mul(0.2);

		await increaseTimeTo(this.afterEndTime);
		await this.crowdsale.finalize({from: wallet}).should.be.fulfilled;
		(await this.token.balanceOf(wallet)).should.be.bignumber.equal(expectedTokenAmount);
		await this.crowdsale.buyTokens(investor, {value: ether(1), from: investor}).should.be.rejectedWith(EVMThrow);

	});
	it('Should burn tokens', async function() {
		await increaseTimeTo(this.startTime + duration.days(1));

		await this.crowdsale.buyTokens(investor, {value: ether(1), from: investor}).should.be.fulfilled;
		await this.token.burn(ether(rate), {from: investor}).should.be.fulfilled;
		(await this.token.balanceOf(investor)).should.be.bignumber.equal(0);
		(await this.token.totalSupply()).should.be.bignumber.equal(0);

	});
	it('Should Manually issue tokens', async function() {
		await increaseTimeTo(this.startTime + duration.days(1));
		await this.crowdsale.offChainMint(investor, 150000000000000000000000, {from: wallet}).should.be.fulfilled;
		(await this.token.balanceOf(investor)).should.be.bignumber.equal(150000000000000000000000);
		(await this.token.totalSupply()).should.be.bignumber.equal(150000000000000000000000);

	});
	it('Should Fail to Manually issue tokens over the cap', async function() {
		await increaseTimeTo(this.startTime + duration.days(1));
		await this.crowdsale.offChainMint(investor, 170000000000000000000000, {from: wallet}).should.be.rejectedWith(EVMThrow);
		(await this.token.balanceOf(investor)).should.be.bignumber.equal(0);
		(await this.token.totalSupply()).should.be.bignumber.equal(0);
		
	});
	it('should finalize crowdsale at cap', async function() {
		await increaseTimeTo(this.startTime);
		await this.crowdsale.offChainMint(investor, 150000000000000000000000,{from: wallet}).should.be.fulfilled;

		const amountMinted = new BigNumber(await this.token.totalSupply());
		const expectedTokenAmount = amountMinted.mul(0.2);

		await increaseTimeTo(this.afterEndTime);
		await this.crowdsale.finalize({from: wallet}).should.be.fulfilled;
		(await this.token.balanceOf(wallet)).should.be.bignumber.equal(expectedTokenAmount);
		(await this.token.totalSupply()).should.be.bignumber.equal(amountMinted.add(expectedTokenAmount));
	});
	//============NEED TO GIVE TEST ACCOUNTS MORE ETHER IN ORDER TO TEST THIS!!=========
	// it('should reject payment over the cap', async function () {
	// 	await increaseTimeTo(this.startTime + duration.days(1));
	// 	await this.crowdsale.send(ether(15000), {from: investor});
	// 	await this.crowdsale.send(1, {from: investor}).should.be.rejectedWith(EVMThrow);
	// })
	

})