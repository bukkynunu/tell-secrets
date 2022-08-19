// SPDX-License-Identifier: MIT  

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Secrets{
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Secret{
        address payable owner;
        string secretText;
        uint likes;
        uint dislikes;
    }

    mapping(uint => Secret) internal secrets;
    uint secretLength = 0;

    function addSecret(
        string memory _text
    )public{
        Secret storage secret = secrets[secretLength];
        secret.owner = payable(msg.sender);
        secret.secretText = _text;
        secret.likes = 0;
        secret.dislikes = 0;
        secretLength++;
    }

    function giftOwner(
        uint amount,
        uint _index
    )public{
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                secrets[_index].owner,
                amount
            ),
            "Transaction could not be performed"  
        ); 
    }

    function getSecret(uint _index) public view returns(
        address payable,
        string memory,
        uint,
        uint256
    ){
        Secret storage secret  = secrets[_index];
        return (
            secret.owner,
            secret.secretText,
            secret.likes,
            secret.dislikes
        );
    }

    function likeSecret(uint _index) public {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                secrets[_index].owner,
                100000000000000000
            ),
            "Transaction could not be performed"  
        );
        secrets[_index].likes++;
    }
    function dislikeSecret(uint _index) public {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                secrets[_index].owner,
                100000000000000000
            ),
            "Transaction could not be performed"  
        );
        secrets[_index].dislikes++;
    }

    function getSecretLength() public view returns (uint) {
        return (secretLength);
    }

}