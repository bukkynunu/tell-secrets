// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract Secrets {
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Secret {
        address payable owner;
        string secretText;
        uint likes;
    }

    mapping(uint => Secret) private secrets;
    // keeps track of users who liked a secret
    mapping(uint => mapping(address => bool)) public liked;
    // keeps track of secrets that exist
    mapping(uint => bool) public exists;
    // keeps track of users that are allowed to view a secret
    mapping(uint => mapping(address => bool)) public allowed;
    uint secretLength = 0;
    uint public feeToLike = 0.1 ether;

    modifier exist(uint _index) {
        require(exists[_index], "Query of nonexistent secret");
        _;
    }

    /// @dev checks if a user is allowed to interact with secret with id of _index
    modifier checkAllow(uint _index) {
        require(
            allowed[_index][msg.sender],
            "You have already allowed this user"
        );
        _;
    }

    /// @dev allow users to add a secret
    function addSecret(string calldata _text) public {
        require(bytes(_text).length > 0, "Text of secret can't be empty");
        secrets[secretLength] = Secret(payable(msg.sender), _text, 0);
        secretLength++;
    }

    /// @dev allow users to gift the owner of a secret
    function giftOwner(uint amount, uint _index)
        public
        exist(_index)
        checkAllow(_index)
    {
        require(amount > 0, "Gift amount must be at least one wei");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                secrets[_index].owner,
                amount
            ),
            "Transaction could not be performed"
        );
    }

    /// @dev allow secrets' owners to allow a user to view their secrets
    function allowView(uint _index, address user) public exist(_index) {
        require(user != address(0), "Invalid address");
        require(secrets[_index].owner == msg.sender, "Unauthorized caller");
        require(!allowed[_index][user], "You have already allowed this user");
        allowed[_index][user] = true;
    }

    /// @dev returns the data of a secret
    /// @notice callable only by users authorized to view secret
    function getSecret(uint _index)
        public
        view
        exist(_index)
        checkAllow(_index)
        returns (
            address payable,
            string memory,
            uint256
        )
    {
        Secret storage secret = secrets[_index];
        return (secret.owner, secret.secretText, secret.likes);
    }

    /// @dev allow users to like a secret
    function likeSecret(uint _index) public exist(_index) checkAllow(_index) {
        require(!liked[_index][msg.sender], "Already liked");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                secrets[_index].owner,
                feeToLike
            ),
            "Transaction could not be performed"
        );
        secrets[_index].likes++;
        liked[_index][msg.sender] = true;
    }

    /// @dev allow users to dislike a secret
    function dislikeSecret(uint _index)
        public
        exist(_index)
        checkAllow(_index)
    {
        require(liked[_index][msg.sender], "You haven't liked this secret");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                secrets[_index].owner,
                feeToLike
            ),
            "Transaction could not be performed"
        );
        secrets[_index].likes--;
        liked[_index][msg.sender] = false;
    }

    function getSecretLength() public view returns (uint) {
        return (secretLength);
    }
}
