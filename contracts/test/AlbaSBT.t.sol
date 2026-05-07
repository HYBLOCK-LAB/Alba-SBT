// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AlbaSBT} from "../src/AlbaSBT.sol";

interface Vm {
    function addr(uint256 privateKey) external returns (address);
    function sign(uint256 privateKey, bytes32 digest) external returns (uint8 v, bytes32 r, bytes32 s);
    function prank(address sender) external;
}

contract AlbaSBTTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 private constant MANAGER_PK = 0xA11CE;
    uint256 private constant PLATFORM_PK = 0xB0B;
    uint256 private constant WORKER_PK = 0xCAFE;

    AlbaSBT private albaSBT;
    address private manager;
    address private platformSigner;
    address private worker;

    function setUp() public {
        manager = vm.addr(MANAGER_PK);
        platformSigner = vm.addr(PLATFORM_PK);
        worker = vm.addr(WORKER_PK);

        albaSBT = new AlbaSBT(address(this), platformSigner);
        albaSBT.setManagerAuthorization(manager, true);
    }

    function testInitialMintSetsLevelAndToken() public {
        uint256 tokenId = albaSBT.mintInitialLevel(worker, "ipfs://level-1");

        require(tokenId == 1, "unexpected token id");
        require(albaSBT.currentLevel(worker) == 1, "level not set");
        require(albaSBT.ownerOf(tokenId) == worker, "owner mismatch");
    }

    function testApproveLevelUpMintsNextLevel() public {
        albaSBT.mintInitialLevel(worker, "ipfs://level-1");

        AlbaSBT.LevelApproval memory approval = AlbaSBT.LevelApproval({
            worker: worker,
            level: 2,
            nonce: 0
        });

        bytes32 digest = albaSBT.hashLevelApproval(approval);
        bytes memory managerSig = _sign(MANAGER_PK, digest);
        bytes memory platformSig = _sign(PLATFORM_PK, digest);

        uint256 tokenId =
            albaSBT.approveLevelUp(worker, 2, 0, managerSig, platformSig, "ipfs://level-2");

        require(tokenId == 2, "unexpected token id");
        require(albaSBT.currentLevel(worker) == 2, "level not upgraded");
        require(albaSBT.nonces(worker) == 1, "nonce not incremented");
        require(albaSBT.ownerOf(tokenId) == worker, "owner mismatch");
    }

    function testApproveLevelUpRejectsNonceReplay() public {
        albaSBT.mintInitialLevel(worker, "ipfs://level-1");

        AlbaSBT.LevelApproval memory approval = AlbaSBT.LevelApproval({
            worker: worker,
            level: 2,
            nonce: 0
        });

        bytes32 digest = albaSBT.hashLevelApproval(approval);
        bytes memory managerSig = _sign(MANAGER_PK, digest);
        bytes memory platformSig = _sign(PLATFORM_PK, digest);

        albaSBT.approveLevelUp(worker, 2, 0, managerSig, platformSig, "ipfs://level-2");

        (bool success,) = address(albaSBT).call(
            abi.encodeWithSelector(
                albaSBT.approveLevelUp.selector,
                worker,
                uint8(3),
                uint256(0),
                managerSig,
                platformSig,
                "ipfs://level-3"
            )
        );

        require(!success, "replay should fail");
    }

    function testTransfersAreBlocked() public {
        uint256 tokenId = albaSBT.mintInitialLevel(worker, "ipfs://level-1");

        vm.prank(worker);
        (bool success,) = address(albaSBT).call(
            abi.encodeWithSelector(albaSBT.transferFrom.selector, worker, manager, tokenId)
        );

        require(!success, "transfer should fail");
    }

    function testApproveLevelUpRejectsUnauthorizedManager() public {
        albaSBT.mintInitialLevel(worker, "ipfs://level-1");

        uint256 fakeManagerPk = 0xDEAD;
        AlbaSBT.LevelApproval memory approval = AlbaSBT.LevelApproval({
            worker: worker,
            level: 2,
            nonce: 0
        });

        bytes32 digest = albaSBT.hashLevelApproval(approval);
        bytes memory managerSig = _sign(fakeManagerPk, digest);
        bytes memory platformSig = _sign(PLATFORM_PK, digest);

        (bool success,) = address(albaSBT).call(
            abi.encodeWithSelector(
                albaSBT.approveLevelUp.selector,
                worker,
                uint8(2),
                uint256(0),
                managerSig,
                platformSig,
                "ipfs://level-2"
            )
        );

        require(!success, "unauthorized manager should fail");
    }

    function testApproveLevelUpRejectsInvalidPlatformSigner() public {
        albaSBT.mintInitialLevel(worker, "ipfs://level-1");

        uint256 fakePlatformPk = 0xBEEF;
        AlbaSBT.LevelApproval memory approval = AlbaSBT.LevelApproval({
            worker: worker,
            level: 2,
            nonce: 0
        });

        bytes32 digest = albaSBT.hashLevelApproval(approval);
        bytes memory managerSig = _sign(MANAGER_PK, digest);
        bytes memory platformSig = _sign(fakePlatformPk, digest);

        (bool success,) = address(albaSBT).call(
            abi.encodeWithSelector(
                albaSBT.approveLevelUp.selector,
                worker,
                uint8(2),
                uint256(0),
                managerSig,
                platformSig,
                "ipfs://level-2"
            )
        );

        require(!success, "invalid platform signer should fail");
    }

    function testApproveLevelUpRejectsSameLevel() public {
        albaSBT.mintInitialLevel(worker, "ipfs://level-1");

        AlbaSBT.LevelApproval memory approval = AlbaSBT.LevelApproval({
            worker: worker,
            level: 1,
            nonce: 0
        });

        bytes32 digest = albaSBT.hashLevelApproval(approval);
        bytes memory managerSig = _sign(MANAGER_PK, digest);
        bytes memory platformSig = _sign(PLATFORM_PK, digest);

        (bool success,) = address(albaSBT).call(
            abi.encodeWithSelector(
                albaSBT.approveLevelUp.selector,
                worker,
                uint8(1),
                uint256(0),
                managerSig,
                platformSig,
                "ipfs://level-1-again"
            )
        );

        require(!success, "same level should fail");
    }

    function testBurnRecomputesCurrentLevel() public {
        uint256 levelOneTokenId = albaSBT.mintInitialLevel(worker, "ipfs://level-1");

        AlbaSBT.LevelApproval memory approval = AlbaSBT.LevelApproval({
            worker: worker,
            level: 2,
            nonce: 0
        });

        bytes32 digest = albaSBT.hashLevelApproval(approval);
        bytes memory managerSig = _sign(MANAGER_PK, digest);
        bytes memory platformSig = _sign(PLATFORM_PK, digest);

        uint256 levelTwoTokenId =
            albaSBT.approveLevelUp(worker, 2, 0, managerSig, platformSig, "ipfs://level-2");

        require(albaSBT.currentLevel(worker) == 2, "expected level 2 before burn");

        vm.prank(worker);
        albaSBT.burn(levelTwoTokenId);

        require(albaSBT.currentLevel(worker) == 1, "level should fall back to 1");
        require(albaSBT.ownerOf(levelOneTokenId) == worker, "level 1 token should remain");
    }

    function _sign(uint256 privateKey, bytes32 digest) internal returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
