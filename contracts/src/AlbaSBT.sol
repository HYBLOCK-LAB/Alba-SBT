// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC5192 is IERC165 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool);
}

library Strings {
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

library ECDSA {
    error InvalidSignatureLength();
    error InvalidSignatureS();
    error InvalidSignatureV();

    bytes32 private constant _HALF_ORDER =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        if (signature.length != 65) {
            revert InvalidSignatureLength();
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        if (uint256(s) > uint256(_HALF_ORDER)) {
            revert InvalidSignatureS();
        }
        if (v != 27 && v != 28) {
            revert InvalidSignatureV();
        }

        return ecrecover(hash, v, r, s);
    }
}

abstract contract Ownable {
    error NotOwner();

    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "new owner is zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

contract AlbaSBT is IERC721Metadata, IERC5192, Ownable {
    using Strings for uint256;

    error ZeroAddress();
    error InvalidLevel();
    error InvalidNonce();
    error UnauthorizedManager();
    error UnauthorizedPlatform();
    error LevelNotIncreasing();
    error TokenDoesNotExist();
    error Soulbound();
    error NotTokenOwner();

    string private constant _NAME = "AlbaSBT";
    string private constant _SYMBOL = "ASBT";
    string private constant _SIGNING_NAME = "AlbaSBT";
    string private constant _SIGNING_VERSION = "1";
    bytes32 private constant _LEVEL_APPROVAL_TYPEHASH =
        keccak256("LevelApproval(address worker,uint8 level,uint256 nonce)");
    bytes32 private constant _EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    uint8 public constant MAX_LEVEL = 10;

    struct LevelApproval {
        address worker;
        uint8 level;
        uint256 nonce;
    }

    address public platformSigner;
    uint256 public nextTokenId = 1;

    mapping(address => bool) public authorizedManagers;
    mapping(address => uint256) public nonces;
    mapping(address => uint8) public currentLevel;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => uint8) public tokenLevels;
    mapping(address => uint256[]) private _ownedTokenIds;
    mapping(uint256 => uint256) private _ownedTokenIndex;

    event PlatformSignerUpdated(address indexed previousSigner, address indexed newSigner);
    event ManagerAuthorizationUpdated(address indexed manager, bool authorized);
    event LevelUpApproved(
        address indexed worker,
        address indexed manager,
        uint8 level,
        uint256 nonce,
        uint256 tokenId,
        string tokenURI
    );
    event InitialLevelMinted(address indexed worker, uint8 level, uint256 tokenId, string tokenURI);
    event TokenBurned(address indexed worker, uint256 indexed tokenId, uint8 level);

    constructor(address initialOwner, address initialPlatformSigner) Ownable(initialOwner) {
        if (initialPlatformSigner == address(0)) {
            revert ZeroAddress();
        }
        platformSigner = initialPlatformSigner;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IERC5192).interfaceId;
    }

    function name() external pure returns (string memory) {
        return _NAME;
    }

    function symbol() external pure returns (string memory) {
        return _SYMBOL;
    }

    function balanceOf(address owner_) external view returns (uint256) {
        if (owner_ == address(0)) {
            revert ZeroAddress();
        }
        return _balances[owner_];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        if (tokenOwner == address(0)) {
            revert TokenDoesNotExist();
        }
        return tokenOwner;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        _requireMinted(tokenId);
        return _tokenURIs[tokenId];
    }

    function locked(uint256 tokenId) external view returns (bool) {
        _requireMinted(tokenId);
        return true;
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function transferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function approve(address, uint256) external pure {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) external pure {
        revert Soulbound();
    }

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    function domainSeparator() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                _EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(_SIGNING_NAME)),
                keccak256(bytes(_SIGNING_VERSION)),
                block.chainid,
                address(this)
            )
        );
    }

    function hashLevelApproval(LevelApproval memory approval) public view returns (bytes32) {
        bytes32 structHash =
            keccak256(abi.encode(_LEVEL_APPROVAL_TYPEHASH, approval.worker, approval.level, approval.nonce));
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator(), structHash));
    }

    function setPlatformSigner(address newPlatformSigner) external onlyOwner {
        if (newPlatformSigner == address(0)) {
            revert ZeroAddress();
        }

        emit PlatformSignerUpdated(platformSigner, newPlatformSigner);
        platformSigner = newPlatformSigner;
    }

    function setManagerAuthorization(address manager, bool authorized) external onlyOwner {
        if (manager == address(0)) {
            revert ZeroAddress();
        }

        authorizedManagers[manager] = authorized;
        emit ManagerAuthorizationUpdated(manager, authorized);
    }

    function mintInitialLevel(address worker, string calldata metadataURI) external returns (uint256 tokenId) {
        if (msg.sender != owner && msg.sender != platformSigner) {
            revert UnauthorizedPlatform();
        }
        if (worker == address(0)) {
            revert ZeroAddress();
        }
        if (currentLevel[worker] >= 1) {
            revert LevelNotIncreasing();
        }

        tokenId = _mintLevel(worker, 1, metadataURI);
        emit InitialLevelMinted(worker, 1, tokenId, metadataURI);
    }

    function approveLevelUp(
        address worker,
        uint8 level,
        uint256 nonce,
        bytes calldata managerSig,
        bytes calldata platformSig,
        string calldata metadataURI
    ) external returns (uint256 tokenId) {
        if (worker == address(0)) {
            revert ZeroAddress();
        }
        if (level == 0 || level > MAX_LEVEL) {
            revert InvalidLevel();
        }
        if (nonce != nonces[worker]) {
            revert InvalidNonce();
        }
        if (level <= currentLevel[worker]) {
            revert LevelNotIncreasing();
        }

        LevelApproval memory approval = LevelApproval({worker: worker, level: level, nonce: nonce});
        bytes32 digest = hashLevelApproval(approval);

        address manager = ECDSA.recover(digest, managerSig);
        if (!authorizedManagers[manager]) {
            revert UnauthorizedManager();
        }

        address recoveredPlatformSigner = ECDSA.recover(digest, platformSig);
        if (recoveredPlatformSigner != platformSigner) {
            revert UnauthorizedPlatform();
        }

        nonces[worker] = nonce + 1;
        tokenId = _mintLevel(worker, level, metadataURI);

        emit LevelUpApproved(worker, manager, level, nonce, tokenId, metadataURI);
    }

    function burn(uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        if (msg.sender != owner && msg.sender != tokenOwner) {
            revert NotTokenOwner();
        }

        uint8 burnedLevel = tokenLevels[tokenId];
        _removeOwnedToken(tokenOwner, tokenId);
        _balances[tokenOwner] -= 1;

        delete _owners[tokenId];
        delete _tokenURIs[tokenId];
        delete tokenLevels[tokenId];

        currentLevel[tokenOwner] = _computeHighestLevel(tokenOwner);

        emit Transfer(tokenOwner, address(0), tokenId);
        emit TokenBurned(tokenOwner, tokenId, burnedLevel);
    }

    function tokensOf(address worker) external view returns (uint256[] memory) {
        return _ownedTokenIds[worker];
    }

    function _mintLevel(address worker, uint8 level, string calldata metadataURI) internal returns (uint256 tokenId) {
        tokenId = nextTokenId;
        nextTokenId += 1;

        _owners[tokenId] = worker;
        _balances[worker] += 1;
        _tokenURIs[tokenId] = metadataURI;
        tokenLevels[tokenId] = level;
        currentLevel[worker] = level;

        _ownedTokenIndex[tokenId] = _ownedTokenIds[worker].length;
        _ownedTokenIds[worker].push(tokenId);

        emit Transfer(address(0), worker, tokenId);
        emit Locked(tokenId);
    }

    function _removeOwnedToken(address tokenOwner, uint256 tokenId) internal {
        uint256 index = _ownedTokenIndex[tokenId];
        uint256 lastIndex = _ownedTokenIds[tokenOwner].length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = _ownedTokenIds[tokenOwner][lastIndex];
            _ownedTokenIds[tokenOwner][index] = lastTokenId;
            _ownedTokenIndex[lastTokenId] = index;
        }

        _ownedTokenIds[tokenOwner].pop();
        delete _ownedTokenIndex[tokenId];
    }

    function _computeHighestLevel(address tokenOwner) internal view returns (uint8 highestLevel) {
        uint256[] memory tokenIds = _ownedTokenIds[tokenOwner];
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint8 level = tokenLevels[tokenIds[i]];
            if (level > highestLevel) {
                highestLevel = level;
            }
        }
    }

    function _requireMinted(uint256 tokenId) internal view {
        if (_owners[tokenId] == address(0)) {
            revert TokenDoesNotExist();
        }
    }
}
