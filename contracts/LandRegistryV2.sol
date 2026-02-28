// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistryV2 {
    
    // ============ ENUMS ============
    enum UserRole { None, Seller, Buyer }
    enum LandRequestStatus { Pending, Approved, Rejected, Completed }
    
    // ============ STRUCTS ============
    
    struct User {
        address walletAddress;
        UserRole role;
        string name;
        bool isVerified;
        uint256 registrationDate;
    }
    
    struct Land {
        uint256 id;
        address seller;
        string location;
        uint256 area;
        uint256 price;
        string imageURL;
        bool isAvailable;
        uint256 registrationDate;
    }
    
    struct LandRequest {
        uint256 id;
        uint256 landId;
        address buyer;
        address seller;
        uint256 price;
        LandRequestStatus status;
        bool paymentReceived;
        uint256 createdDate;
        uint256 approvedDate;
        uint256 completedDate;
    }
    
    // ============ STATE VARIABLES ============
    
    address public inspector;
    address public contractOwner;
    
    mapping(address => User) public users;
    mapping(uint256 => Land) public lands;
    mapping(uint256 => LandRequest) public landRequests;
    mapping(address => uint256[]) public userLands;
    mapping(address => uint256[]) public userRequests;
    mapping(uint256 => address[]) public landRequestHistory;
    
    uint256 public landCounter = 0;
    uint256 public requestCounter = 0;
    
    // ============ EVENTS ============
    
    event UserRegistered(address indexed walletAddress, UserRole role, string name);
    event UserVerified(address indexed walletAddress);
    event LandRegistered(uint256 indexed landId, address indexed seller, string location, uint256 price);
    event LandRequestCreated(uint256 indexed requestId, uint256 indexed landId, address indexed buyer, uint256 price);
    event RequestApproved(uint256 indexed requestId, uint256 indexed landId);
    event PaymentReceived(uint256 indexed requestId, address indexed buyer, uint256 amount);
    event TransferFinalized(uint256 indexed requestId, uint256 indexed landId, address indexed newOwner);
    event RequestRejected(uint256 indexed requestId);
    
    // ============ MODIFIERS ============
    
    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Only owner can call this");
        _;
    }
    
    modifier onlyVerifiedUser() {
        require(users[msg.sender].isVerified, "User not verified");
        _;
    }
    
    modifier onlySeller() {
        require(users[msg.sender].role == UserRole.Seller, "Only sellers can call this");
        _;
    }
    
    modifier onlyBuyer() {
        require(users[msg.sender].role == UserRole.Buyer, "Only buyers can call this");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _inspector) {
        require(_inspector != address(0), "Invalid inspector address");
        inspector = _inspector;
        contractOwner = msg.sender;
    }
    
    // ============ OWNER FUNCTIONS ============
    
    function setInspector(address _newInspector) public onlyOwner {
        require(_newInspector != address(0), "Invalid inspector address");
        inspector = _newInspector;
    }
    
    // ============ USER MANAGEMENT ============
    
    function registerUser(UserRole _role, string memory _name) public {
        require(_role != UserRole.None, "Invalid role");
        require(users[msg.sender].walletAddress == address(0), "User already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        users[msg.sender] = User({
            walletAddress: msg.sender,
            role: _role,
            name: _name,
            isVerified: false,
            registrationDate: block.timestamp
        });
        
        emit UserRegistered(msg.sender, _role, _name);
    }
    
    function verifyUser(address _userAddress) public onlyInspector {
        require(users[_userAddress].walletAddress != address(0), "User not registered");
        require(!users[_userAddress].isVerified, "User already verified");
        
        users[_userAddress].isVerified = true;
        
        emit UserVerified(_userAddress);
    }
    
    function getUser(address _userAddress) public view returns (User memory) {
        require(users[_userAddress].walletAddress != address(0), "User not found");
        return users[_userAddress];
    }
    
    // ============ LAND MANAGEMENT ============
    
    function registerLand(
        string memory _location,
        uint256 _area,
        uint256 _price,
        string memory _imageURL
    ) public onlyVerifiedUser onlySeller {
        require(_area > 0, "Area must be greater than zero");
        require(_price > 0, "Price must be greater than zero");
        require(bytes(_location).length > 0, "Location cannot be empty");
        
        landCounter++;
        uint256 landId = landCounter;
        
        lands[landId] = Land({
            id: landId,
            seller: msg.sender,
            location: _location,
            area: _area,
            price: _price,
            imageURL: _imageURL,
            isAvailable: true,
            registrationDate: block.timestamp
        });
        
        userLands[msg.sender].push(landId);
        
        emit LandRegistered(landId, msg.sender, _location, _price);
    }
    
    function getLand(uint256 _landId) public view returns (Land memory) {
        require(_landId > 0 && _landId <= landCounter, "Invalid land ID");
        return lands[_landId];
    }
    
    function getAvailableLands() public view returns (Land[] memory) {
        uint256 count = 0;
        
        // Count available lands
        for (uint256 i = 1; i <= landCounter; i++) {
            if (lands[i].isAvailable) {
                count++;
            }
        }
        
        Land[] memory availableLands = new Land[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= landCounter; i++) {
            if (lands[i].isAvailable) {
                availableLands[index] = lands[i];
                index++;
            }
        }
        
        return availableLands;
    }
    
    function getSellerLands(address _seller) public view returns (Land[] memory) {
        uint256[] memory landIds = userLands[_seller];
        Land[] memory sellerLands = new Land[](landIds.length);
        
        for (uint256 i = 0; i < landIds.length; i++) {
            sellerLands[i] = lands[landIds[i]];
        }
        
        return sellerLands;
    }
    
    // ============ LAND REQUEST MANAGEMENT ============
    
    function requestLand(uint256 _landId) public payable onlyVerifiedUser onlyBuyer {
        require(_landId > 0 && _landId <= landCounter, "Invalid land ID");
        
        Land storage land = lands[_landId];
        require(land.isAvailable, "Land not available");
        require(msg.value == land.price, "Payment amount does not match land price");
        require(msg.sender != land.seller, "Seller cannot request own land");
        
        requestCounter++;
        uint256 requestId = requestCounter;
        
        landRequests[requestId] = LandRequest({
            id: requestId,
            landId: _landId,
            buyer: msg.sender,
            seller: land.seller,
            price: land.price,
            status: LandRequestStatus.Pending,
            paymentReceived: true,
            createdDate: block.timestamp,
            approvedDate: 0,
            completedDate: 0
        });
        
        userRequests[msg.sender].push(requestId);
        userRequests[land.seller].push(requestId);
        landRequestHistory[_landId].push(msg.sender);
        
        // Mark land as unavailable
        land.isAvailable = false;
        
        emit LandRequestCreated(requestId, _landId, msg.sender, land.price);
        emit PaymentReceived(requestId, msg.sender, msg.value);
    }
    
    function approveLandRequest(uint256 _requestId) public onlyVerifiedUser {
        require(_requestId > 0 && _requestId <= requestCounter, "Invalid request ID");
        
        LandRequest storage request = landRequests[_requestId];
        require(request.status == LandRequestStatus.Pending, "Request is not pending");
        require(msg.sender == request.seller, "Only seller can approve");
        
        request.status = LandRequestStatus.Approved;
        request.approvedDate = block.timestamp;
        
        emit RequestApproved(_requestId, request.landId);
    }
    
    function rejectLandRequest(uint256 _requestId) public {
        require(_requestId > 0 && _requestId <= requestCounter, "Invalid request ID");
        
        LandRequest storage request = landRequests[_requestId];
        require(request.status == LandRequestStatus.Pending, "Request is not pending");
        require(msg.sender == request.seller || msg.sender == inspector, "Not authorized");
        
        request.status = LandRequestStatus.Rejected;
        
        // Make land available again
        lands[request.landId].isAvailable = true;
        
        // Refund payment to buyer
        (bool success, ) = request.buyer.call{value: request.price}("");
        require(success, "Refund failed");
        
        emit RequestRejected(_requestId);
    }
    
    function getLandRequest(uint256 _requestId) public view returns (LandRequest memory) {
        require(_requestId > 0 && _requestId <= requestCounter, "Invalid request ID");
        return landRequests[_requestId];
    }
    
    function getBuyerRequests(address _buyer) public view returns (LandRequest[] memory) {
        uint256[] memory requestIds = userRequests[_buyer];
        LandRequest[] memory buyerRequests = new LandRequest[](requestIds.length);
        
        for (uint256 i = 0; i < requestIds.length; i++) {
            buyerRequests[i] = landRequests[requestIds[i]];
        }
        
        return buyerRequests;
    }
    
    // ============ INSPECTOR FUNCTIONS ============
    
    function finalizeTransfer(uint256 _requestId) public onlyInspector {
        require(_requestId > 0 && _requestId <= requestCounter, "Invalid request ID");
        
        LandRequest storage request = landRequests[_requestId];
        require(request.status == LandRequestStatus.Approved, "Request not approved");
        require(request.paymentReceived, "Payment not received");
        
        // Transfer land ownership
        Land storage land = lands[request.landId];
        land.seller = request.buyer;
        land.isAvailable = true;
        
        // Update user lands
        userLands[request.buyer].push(request.landId);
        
        // Mark request as completed
        request.status = LandRequestStatus.Completed;
        request.completedDate = block.timestamp;
        
        // Release payment to original seller
        address originalSeller = request.seller;
        (bool success, ) = originalSeller.call{value: request.price}("");
        require(success, "Payment to seller failed");
        
        emit TransferFinalized(_requestId, request.landId, request.buyer);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getTotalLands() public view returns (uint256) {
        return landCounter;
    }
    
    function getTotalRequests() public view returns (uint256) {
        return requestCounter;
    }
    
    // ============ EMERGENCY FUNCTIONS ============
    
    function withdrawBalance() public onlyInspector {
        uint256 balance = address(this).balance;
        (bool success, ) = inspector.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    receive() external payable {}
}
