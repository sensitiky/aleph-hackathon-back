
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract CarbonCreditToken is ERC20, AccessControl, Pausable, ReentrancyGuard {
    

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    

    struct CreditMetadata {
        string projectId;           
        string projectName;        
        CreditType creditType;     
        uint256 vintageYear;       
        string methodology;        
        string country;           
        string region;            
        uint256 issuanceDate;      
        string verificationBody;  
        string ipfsHash;           
        bool isRetired;           
        address retiredBy;         
        uint256 retiredAt;         
    }
    
    enum CreditType {
        FORESTRY,          
        RENEWABLE_ENERGY,   
        ENERGY_EFFICIENCY,  
        WASTE_MANAGEMENT,   
        AGRICULTURE,      
        BLUE_CARBON,       
        DIRECT_CAPTURE,    
        OTHER              
    }
    

    uint256 private _creditIdCounter;

    mapping(uint256 => CreditMetadata) public creditMetadata;

    mapping(address => uint256[]) public userCredits;
    
    mapping(uint256 => address) public creditOwner;
    
    mapping(string => uint256[]) public projectCredits;
    

    uint256 public totalRetiredCredits;
    
    mapping(string => bool) public verifiedProjects;

    event CreditMinted(
        uint256 indexed creditId,
        address indexed to,
        uint256 amount,
        string projectId,
        CreditType creditType
    );
    
    event CreditRetired(
        uint256 indexed creditId,
        address indexed by,
        uint256 amount,
        string reason
    );
    
    event ProjectVerified(
        string indexed projectId,
        address indexed verifier
    );
    
    event MetadataUpdated(
        uint256 indexed creditId,
        string ipfsHash
    );
    

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }
    

    function mintCredit(
        address to,
        uint256 amount,
        CreditMetadata memory metadata
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "CarbonCredit: mint to zero address");
        require(amount > 0, "CarbonCredit: amount must be positive");
        require(verifiedProjects[metadata.projectId], "CarbonCredit: project not verified");
        require(metadata.vintageYear <= block.timestamp / 365 days + 1970, "CarbonCredit: invalid vintage year");
        

        _creditIdCounter++;
        uint256 creditId = _creditIdCounter;
        

        creditMetadata[creditId] = metadata;
        creditMetadata[creditId].issuanceDate = block.timestamp;
        creditMetadata[creditId].isRetired = false;
        

        creditOwner[creditId] = to;
        userCredits[to].push(creditId);
        projectCredits[metadata.projectId].push(creditId);
        
        _mint(to, amount);
        
        emit CreditMinted(creditId, to, amount, metadata.projectId, metadata.creditType);
        
        return creditId;
    }
    
  
    function verifyProject(
        string memory projectId
    ) external onlyRole(VERIFIER_ROLE) {
        require(bytes(projectId).length > 0, "CarbonCredit: empty project ID");
        
        verifiedProjects[projectId] = true;
        
        emit ProjectVerified(projectId, msg.sender);
    }
    

    function retireCredit(
        uint256 creditId,
        uint256 amount,
        string memory reason
    ) external nonReentrant {
        require(creditId <= _creditIdCounter && creditId > 0, "CarbonCredit: invalid credit ID");
        require(amount > 0, "CarbonCredit: amount must be positive");
        require(balanceOf(msg.sender) >= amount, "CarbonCredit: insufficient balance");
        require(!creditMetadata[creditId].isRetired, "CarbonCredit: already retired");
        require(bytes(reason).length > 0, "CarbonCredit: empty reason");
        
  
        creditMetadata[creditId].isRetired = true;
        creditMetadata[creditId].retiredBy = msg.sender;
        creditMetadata[creditId].retiredAt = block.timestamp;
        

        totalRetiredCredits += amount;
        _burn(msg.sender, amount);
        
        emit CreditRetired(creditId, msg.sender, amount, reason);
    }
    

    function updateMetadata(
        uint256 creditId,
        string memory newIpfsHash
    ) external onlyRole(VERIFIER_ROLE) {
        require(creditId <= _creditIdCounter && creditId > 0, "CarbonCredit: invalid credit ID");
        require(bytes(newIpfsHash).length > 0, "CarbonCredit: empty IPFS hash");
        
        creditMetadata[creditId].ipfsHash = newIpfsHash;
        
        emit MetadataUpdated(creditId, newIpfsHash);
    }
    

    function getCreditMetadata(uint256 creditId) external view returns (CreditMetadata memory) {
        require(creditId <= _creditIdCounter && creditId > 0, "CarbonCredit: invalid credit ID");
        return creditMetadata[creditId];
    }
    
   
    function getUserCredits(address user) external view returns (uint256[] memory) {
        return userCredits[user];
    }
    
 
    function getProjectCredits(string memory projectId) external view returns (uint256[] memory) {
        return projectCredits[projectId];
    }
    
 
    function getStats() external view returns (
        uint256 totalSupply_,
        uint256 totalCredits,
        uint256 totalRetired,
        uint256 activeCredits
    ) {
        return (
            totalSupply(),
            _creditIdCounter,
            totalRetiredCredits,
            totalSupply() - totalRetiredCredits
        );
    }
    
 
    function getCreditsByType(CreditType creditType) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](_creditIdCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _creditIdCounter; i++) {
            if (creditMetadata[i].creditType == creditType) {
                result[count] = i;
                count++;
            }
        }
        
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        return finalResult;
    }
    
   
    function getCreditsByVintage(uint256 year) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](_creditIdCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _creditIdCounter; i++) {
            if (creditMetadata[i].vintageYear == year) {
                result[count] = i;
                count++;
            }
        }
        
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        return finalResult;
    }
    
   
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
   
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
   
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
   
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
  
    function decimals() public pure override returns (uint8) {
        return 0;
    }
}
