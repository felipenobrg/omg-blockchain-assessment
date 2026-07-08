// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AssessmentToken
/// @notice Simple ERC-20-style token used as a smart contract assessment artifact.
/// @dev Not audited. Supply is fixed at deployment and only decreases via `burn` — there is
/// no owner, no minting after construction, and no pause/upgrade mechanism, by design.
contract AssessmentToken {
    string public constant name = "AssessmentToken";
    string public constant symbol = "AST";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /// @param initialSupply Whole-token amount minted to the deployer (scaled by `decimals`).
    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    /// @notice Transfers `value` tokens from the caller to `to`.
    function transfer(address to, uint256 value) external returns (bool) {
        require(to != address(0), "transfer to zero address");
        require(balanceOf[msg.sender] >= value, "insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    /// @notice Approves `spender` to transfer up to `value` tokens on the caller's behalf.
    function approve(address spender, uint256 value) external returns (bool) {
        require(spender != address(0), "approve to zero address");
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    /// @notice Transfers `value` tokens from `from` to `to`, spending the caller's allowance.
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(to != address(0), "transfer to zero address");
        require(balanceOf[from] >= value, "insufficient balance");
        require(allowance[from][msg.sender] >= value, "allowance exceeded");

        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }

    /// @notice Destroys `value` tokens from the caller's own balance, reducing total supply.
    function burn(uint256 value) external {
        require(balanceOf[msg.sender] >= value, "insufficient balance");
        balanceOf[msg.sender] -= value;
        totalSupply -= value;
        emit Transfer(msg.sender, address(0), value);
    }
}
