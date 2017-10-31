pragma solidity ^0.4.11;

import './fortitude.sol';
import '../installed_contracts/zeppelin/contracts/crowdsale/FinalizableCrowdsale.sol';
import '../installed_contracts/zeppelin/contracts/crowdsale/CappedCrowdsale.sol';

contract FortitudeRanchCrowdsale is FinalizableCrowdsale, CappedCrowdsale {

	function FortitudeRanchCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet)
		FinalizableCrowdsale()
		CappedCrowdsale(1500000000000000000000)
		Crowdsale(_startTime, _endTime, _rate, _wallet)
	{
	}
	function buyTokens(address beneficiary) public payable {
	    require(beneficiary != 0x0);
	    require(validPurchase());

	    uint256 weiAmount = msg.value;

	    // calculate token amount to be created
	    if(now < (startTime + 1 days)){
	    	uint256 discountRate = rate.mul(12000000);
	    	discountRate = discountRate.div(10000);
	    	uint256 tokens = weiAmount.mul(discountRate).div(1000);
	    } else { 
	    	 tokens = weiAmount.mul(rate);
		}
	    // update state
	    weiRaised = weiRaised.add(weiAmount);

	    token.mint(beneficiary, tokens);
	    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

	    forwardFunds();
	}
	function validPurchase() internal constant returns (bool) {
		require(msg.value >= 100000000000000000);
	    if(now < (startTime + 1 days)){
	    	uint256 discountRate = rate.mul(12000000);
	    	discountRate = discountRate.div(10000);
	    	uint256 tokens = (msg.value).mul(discountRate).div(1000);
	    } else { 
	    	 tokens = (msg.value).mul(rate);
		}
		bool withinCap = token.totalSupply().add(tokens) <= cap;
		return super.validPurchase() && withinCap;

	}
	function hasEnded() public constant returns (bool) {
		bool capReached = token.totalSupply() >= cap;
		return super.hasEnded() || capReached;
	}
	function finalization() internal {
		uint256 tokensAmount = token.totalSupply();
		tokensAmount = tokensAmount.mul(2);
		tokensAmount = tokensAmount.div(10);
		token.mint(owner, tokensAmount);
		token.finishMinting();

		super.finalization();


	}
	function createTokenContract() internal returns (MintableToken) {
		return new Fortitude();
	}

}