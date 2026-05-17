// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AlbaSBT} from "../src/AlbaSBT.sol";

interface Vm {
    function envAddress(string calldata name) external returns (address);
    function envUint(string calldata name) external returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployAlbaSBTScript {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (AlbaSBT deployed) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address initialOwner = vm.envAddress("INITIAL_OWNER_ADDRESS");
        address platformSigner = vm.envAddress("PLATFORM_SIGNER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);
        deployed = new AlbaSBT(initialOwner, platformSigner);
        vm.stopBroadcast();
    }
}
