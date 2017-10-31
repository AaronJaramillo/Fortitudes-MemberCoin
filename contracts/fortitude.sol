pragma solidity ^0.4.11;

import '../installed_contracts/zeppelin/contracts/token/MintableToken.sol';
import '../installed_contracts/zeppelin/contracts/ownership/Ownable.sol';
import '../installed_contracts/zeppelin/contracts/token/BurnableToken.sol';

contract Fortitude is MintableToken, BurnableToken {
	//Token Metadata
	string public name = "Fortitude";
	string public symbol = "FRT";
	uint256 public decimals = 18;

}

