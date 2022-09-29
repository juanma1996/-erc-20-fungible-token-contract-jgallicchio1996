//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

 /// @notice This contact follows the standard for ERC-20 fungible tokens
 /// @dev Comment follow the Ethereum ´Natural Specification´ language format (´natspec´)
 /// Referencia: https://docs.soliditylang.org/en/v0.8.16/natspec-format.html  
contract ERC20 {

    /// STATE VARIABLES
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    uint256 public maxSupply;

    /// STATE MAPPINGS
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// EVENTS
    /// @notice Trigger when tokens are transferred
    /// @dev On new tokens creation, trigger with the `from` address set to zero address
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    
    /// @notice Trigger on any successful call to `approve` method
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    /// @notice Trigger on any successful call to `burn` method
    event Burn(address indexed _from, address indexed _commandedBy, uint256 _value);

    /**
     * @notice Initialize the state of the contract
     * @dev Throw if `_name` is empty. Message: "constructor - Invalid parameter: _name"
     * @dev Throw if `_symbol` is empty. Message: "constructor - Invalid parameter: _symbol"
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _maxSupply The maximum supply of the token. Zero for unlimited emition
     */
    constructor(string memory _name, string memory _symbol, uint256 _maxSupply) {
        string memory _methodName = 'constructor';
        _isEmptyString(_name, _methodName, '_name');
        _isEmptyString(_symbol, _methodName, '_symbol');
        name = _name;
        symbol = _symbol;
        maxSupply = _maxSupply;
        decimals = 18; // Same as ether
    }

    /// EXTERNAL FUNCTIONS

    /**
     * @notice Transfers `_value` amount of tokens to address `_to`. On success must fire the `Transfer` event.
     * @dev Throw if `_to` is zero address. Message: "transfer - Invalid parameter: _to"
     * @dev Throw if `_to` is sender account. Message: "transfer - Invalid recipient, same as remittent"
     * @dev Throw if `_value` is zero. Message: "transfer - Invalid parameter: _value"
     * @dev Throw if remittent account has insufficient balance. Message: "transfer - Insufficient balance"
     * @param _to It is the recipient account address
     * @param _value It is the amount of tokens to transfer.
     */
    function transfer(address _to, uint256 _value) external {
        string memory _methodName = 'transfer';
        _isZeroAddress(_to, _methodName, '_to');
        _isValidRecipient(msg.sender, _to, _methodName);
        _isZeroAmount(_value, _methodName, '_value');
        _hasSufficientBalance(msg.sender, _value, _methodName);
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
    }

    /**
     * @notice Transfers `_value` amount of tokens from address `_from` to address `_to`. 
     * On success must fire the `Transfer` event.
     * @dev Throw if `_from` is zero address. Message: "transferFrom - Invalid parameter: _from"
     * @dev Throw if `_to` is zero address. Message: "transferFrom - Invalid parameter: _to"
     * @dev Throw if `_to` is the same as `_from` account. Message: "transferFrom - Invalid recipient, same as remittent"
     * @dev Throw if `_value` is zero. Message: "transferFrom - Invalid parameter: _value"
     * @dev Throw if `_from` account has insufficient balance. Message: "transferFrom - Insufficient balance"
     * @dev Throws if `msg.sender` is not the current owner or an approved address with permission to spend the balance of the '_from' account
     * Message: "transferFrom - Insufficent allowance"
     * @param _from It is the remittent account address
     * @param _to It is the recipient account address
     * @param _value It is the amount of tokens to transfer.
     */
    function transferFrom(address _from, address _to, uint256 _value) external {
        string memory _methodName = 'transferFrom';
        _isZeroAddress(_from, _methodName, '_from');
        _isZeroAddress(_to, _methodName, '_to');
        _isValidRecipient(_from, _to, _methodName);
        _isZeroAmount(_value, _methodName, '_value');
        _hasSufficientBalance(_from, _value, _methodName);
        _isAuthorized(_from, msg.sender, _value, _methodName);
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(_from, _to, _value);
    }

    /**
     * @notice Allows `_spender` to withdraw from sender account multiple times, up to the `_value` amount
     * On success must fire the `Approval` event.
     * @dev If this function is called multiple times it overwrites the current allowance with `_value`
     * @dev Throw if allowance tries to be set to a new value, higher than zero, for the same spender, 
     * with a current allowance different that zero. Message: "approve - Invalid allowance amount. Set to zero first"
     * @dev Throw if `_spender` is zero address. Message: "approve - Invalid parameter: _spender"
     * @dev Throw if `_value` exceeds the sender's balance. 
     * Message: "approve - Insufficient balance"
     * @param _spender It is the spender account address
     * @param _value It is the allowance amount.
     */
    function approve(address _spender, uint256 _value) external {
        string memory _methodName = 'approve';
        uint256 currentAllowance = allowance[msg.sender][_spender];
        if(_value > 0 && currentAllowance > 0) {
            revert(_concatMessage(_methodName, " - Invalid allowance amount. Set to zero first", ""));
        }
        _isZeroAddress(_spender, _methodName, '_spender');
        _hasSufficientBalance(msg.sender, _value, _methodName);
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
    }

    /**
     * @notice Issues a new amount of tokens in exchange for ethers at a parity of 1 to 1
     * @dev Throw if msg.value is zero. Message: "mint - Invalid ether amount"
     * @dev Throw if `_recipient` is zero address. Message: "mint - Invalid parameter: _recipient"
     * @dev Throw if total supply overcame the maximum supply. Message: "mint - Total supply exceeds maximum supply"
     * @param _recipient It is the recipient account for the new tokens
     */
    function mint(address _recipient) external payable {
        string memory _methodName = 'mint';
        _isZeroValue(_methodName);
        _isZeroAddress(_recipient, _methodName, '_recipient');
        _isMaxSupply(_methodName);
        balanceOf[_recipient] += msg.value;
        totalSupply += msg.value;
        emit Transfer(address(0), _recipient, msg.value);
    }

    /**
     * @notice Returns ethers in exchange for burning an amount of tokens from '_from' account, at a parity of 1 to 1
     * @dev Throw if `_from` is zero address. Message: "burn - Invalid parameter: _from"
     * @dev Throw if `_value` is zero. Message: "burn - Invalid parameter: _value"
     * @dev Throw if `_from` account has insufficient tokens to burn. Message: "burn - Insufficient balance"
     * @dev Throw if sender is not allowed to spend balance from `_from` account.
     * Message: "burn - Insufficent allowance"
     * @param _from It is the address of the account from which tokens will be burned
     * @param _value It is the number of new tokens to be burned
     */
    function burn(address _from, uint256 _value) external {
        string memory _methodName = 'burn';
        _isZeroAddress(_from, _methodName, '_from');
        _isZeroAmount(_value, _methodName, '_value');
        _hasSufficientBalance(_from, _value, _methodName);
        _isAuthorized(_from, msg.sender, _value, _methodName);
        balanceOf[_from] -= _value;
        totalSupply -= _value;
        emit Burn(_from, msg.sender, _value);
        payable(_from).transfer(_value);
    }

    function _concatMessage(string memory _methodName, string memory _message, string memory _parameterName) private pure returns(string memory) {
        return string.concat(_methodName, _message, _parameterName);
    }

    function _isEmptyString(string memory _value, string memory _methodName, string memory _parameterName) private pure {
        if (bytes(_value).length == 0) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _isZeroAddress(address _address, string memory _methodName, string memory _parameterName) private pure {
        if (_address == address(0)) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _isZeroAmount(uint256 _value, string memory _methodName, string memory _parameterName) private pure {
        if (_value == 0) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _hasSufficientBalance(address _address, uint256 _value, string memory _methodName) private view {
        if (balanceOf[_address] < _value) {
            string memory _message = _concatMessage(_methodName, " - Insufficient balance", "");
            revert(_message);
        }
    }

    function _isAuthorized(address _owner, address _spender, uint256 _value, string memory _methodName) private view {
        if (_owner != _spender && allowance[_owner][_spender] < _value) {
            string memory _message = _concatMessage(_methodName, " - Insufficent allowance", "");
            revert(_message);
        }
    }

    function _isValidRecipient(address _remittent, address _recipient, string memory _methodName) private pure {
        if (_recipient == _remittent) {
            string memory _message = _concatMessage(_methodName, " - Invalid recipient, same as remittent", "");
            revert(_message);
        }
    }

    function _isZeroValue(string memory _methodName) private {
        if(msg.value == 0) {
            string memory _message = _concatMessage(_methodName, " - Invalid ether amount", "");
            revert(_message);
        }
    }

    function _isMaxSupply(string memory _methodName) private view {
        if (totalSupply + msg.value > maxSupply) {
            string memory _message = _concatMessage(_methodName, " - Total supply exceeds maximum supply", "");
            revert(_message);
        }
    }
}