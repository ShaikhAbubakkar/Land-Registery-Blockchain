// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistry {
    
    // Structure to store land information
    struct Land {
        uint256 id;
        string location;
        uint256 area;
        address currentOwner;
        uint256 registrationDate;
    }
    
    // Structure to store ownership transfer history
    struct OwnershipRecord {
        address owner;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(uint256 => Land) public lands;
    mapping(uint256 => OwnershipRecord[]) public ownershipHistory;
    mapping(address => uint256[]) public ownerLands;
    
    // Counter for land IDs
    uint256 public landCounter = 0;
    
    // Events
    event LandRegistered(uint256 indexed landId, string location, uint256 area, address indexed owner);
    event OwnershipTransferred(uint256 indexed landId, address indexed fromOwner, address indexed toOwner);
    
    // Register new land
    function registerLand(string memory _location, uint256 _area) public {
        require(_area > 0, "Area must be greater than zero");
        require(bytes(_location).length > 0, "Location cannot be empty");
        
        landCounter++;
        uint256 landId = landCounter;
        
        lands[landId] = Land({
            id: landId,
            location: _location,
            area: _area,
            currentOwner: msg.sender,
            registrationDate: block.timestamp
        });
        
        ownerLands[msg.sender].push(landId);
        
        // Record initial ownership
        ownershipHistory[landId].push(OwnershipRecord({
            owner: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit LandRegistered(landId, _location, _area, msg.sender);
    }
    
    // Transfer land ownership
    function transferOwnership(uint256 _landId, address _newOwner) public {
        require(_landId > 0 && _landId <= landCounter, "Invalid land ID");
        require(lands[_landId].currentOwner == msg.sender, "Only current owner can transfer");
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != msg.sender, "Cannot transfer to yourself");
        
        address previousOwner = lands[_landId].currentOwner;
        lands[_landId].currentOwner = _newOwner;
        
        // Add to new owner's lands
        ownerLands[_newOwner].push(_landId);
        
        // Record ownership change
        ownershipHistory[_landId].push(OwnershipRecord({
            owner: _newOwner,
            timestamp: block.timestamp
        }));
        
        emit OwnershipTransferred(_landId, previousOwner, _newOwner);
    }
    
    // Get land details
    function getLand(uint256 _landId) public view returns (Land memory) {
        require(_landId > 0 && _landId <= landCounter, "Invalid land ID");
        return lands[_landId];
    }
    
    // Get complete ownership history of a land
    function getOwnershipHistory(uint256 _landId) public view returns (OwnershipRecord[] memory) {
        require(_landId > 0 && _landId <= landCounter, "Invalid land ID");
        return ownershipHistory[_landId];
    }
    
    // Get all lands owned by an address
    function getLandsByOwner(address _owner) public view returns (Land[] memory) {
        uint256[] memory landIds = ownerLands[_owner];
        Land[] memory ownerLandsList = new Land[](landIds.length);
        
        for (uint256 i = 0; i < landIds.length; i++) {
            ownerLandsList[i] = lands[landIds[i]];
        }
        
        return ownerLandsList;
    }
    
    // Get total lands registered
    function getTotalLands() public view returns (uint256) {
        return landCounter;
    }
}
