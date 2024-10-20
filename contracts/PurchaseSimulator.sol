// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract PurchaseSimulator {
    event PurchaseMade(address indexed buyer, uint256 amount);

    // Function to simulate a purchase
    function buy(uint256 amount) external payable {
        require(msg.value >= 0.001 ether, "Insufficient fee to simulate purchase");

        // Emit an event to log the purchase
        emit PurchaseMade(msg.sender, amount);

        // Optionally, send back the fee to the buyer
        payable(msg.sender).transfer(msg.value);
    }
}
