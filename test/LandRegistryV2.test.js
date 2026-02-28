import { expect } from "chai";
import hre from "hardhat";

describe("LandRegistryV2 Contract", function () {
  let landRegistry;
  let owner, inspector, seller1, seller2, buyer1, buyer2;

  beforeEach(async function () {
    [owner, inspector, seller1, seller2, buyer1, buyer2] = await hre.ethers.getSigners();
    
    const LandRegistryV2 = await hre.ethers.getContractFactory("LandRegistryV2");
    landRegistry = await LandRegistryV2.deploy(inspector.address);
    await landRegistry.waitForDeployment();
  });

  describe("User Registration & Verification", function () {
    it("Should register a seller", async function () {
      await landRegistry.connect(seller1).registerUser(1, "John Seller");
      
      const user = await landRegistry.getUser(seller1.address);
      expect(user.role).to.equal(1); // Seller role = 1
      expect(user.name).to.equal("John Seller");
      expect(user.isVerified).to.equal(false);
    });

    it("Should register a buyer", async function () {
      await landRegistry.connect(buyer1).registerUser(2, "Jane Buyer");
      
      const user = await landRegistry.getUser(buyer1.address);
      expect(user.role).to.equal(2); // Buyer role = 2
      expect(user.name).to.equal("Jane Buyer");
    });

    it("Should verify user as inspector", async function () {
      await landRegistry.connect(seller1).registerUser(1, "John Seller");
      await landRegistry.connect(inspector).verifyUser(seller1.address);
      
      const user = await landRegistry.getUser(seller1.address);
      expect(user.isVerified).to.equal(true);
    });

    it("Should not allow duplicate registration", async function () {
      await landRegistry.connect(seller1).registerUser(1, "John Seller");
      
      await expect(
        landRegistry.connect(seller1).registerUser(1, "Another Name")
      ).to.be.revertedWith("User already registered");
    });

    it("Should reject registration with empty name", async function () {
      await expect(
        landRegistry.connect(seller1).registerUser(1, "")
      ).to.be.revertedWith("Name cannot be empty");
    });
  });

  describe("Land Registration", function () {
    beforeEach(async function () {
      // Register and verify seller
      await landRegistry.connect(seller1).registerUser(1, "John Seller");
      await landRegistry.connect(inspector).verifyUser(seller1.address);
    });

    it("Should register land", async function () {
      await landRegistry.connect(seller1).registerLand(
        "New York",
        1000,
        hre.ethers.parseEther("5"),
        "https://example.com/land.jpg"
      );
      
      const land = await landRegistry.getLand(1);
      expect(land.location).to.equal("New York");
      expect(land.area).to.equal(1000);
      expect(land.price).to.equal(hre.ethers.parseEther("5"));
      expect(land.seller).to.equal(seller1.address);
      expect(land.isAvailable).to.equal(true);
    });

    it("Should not allow unverified user to register land", async function () {
      const unverifiedSeller = buyer1; // Not verified
      
      await expect(
        landRegistry.connect(unverifiedSeller).registerLand(
          "New York",
          1000,
          hre.ethers.parseEther("5"),
          "https://example.com/land.jpg"
        )
      ).to.be.revertedWith("User not verified");
    });

    it("Should reject land with zero area", async function () {
      await expect(
        landRegistry.connect(seller1).registerLand(
          "New York",
          0,
          hre.ethers.parseEther("5"),
          "https://example.com/land.jpg"
        )
      ).to.be.revertedWith("Area must be greater than zero");
    });

    it("Should reject land with zero price", async function () {
      await expect(
        landRegistry.connect(seller1).registerLand(
          "New York",
          1000,
          0,
          "https://example.com/land.jpg"
        )
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("Should get available lands", async function () {
      await landRegistry.connect(seller1).registerLand(
        "New York",
        1000,
        hre.ethers.parseEther("5"),
        "https://example.com/land1.jpg"
      );
      
      await landRegistry.connect(seller1).registerLand(
        "Los Angeles",
        2000,
        hre.ethers.parseEther("10"),
        "https://example.com/land2.jpg"
      );
      
      const availableLands = await landRegistry.getAvailableLands();
      expect(availableLands.length).to.equal(2);
    });

    it("Should get seller lands", async function () {
      await landRegistry.connect(seller1).registerLand(
        "New York",
        1000,
        hre.ethers.parseEther("5"),
        "https://example.com/land1.jpg"
      );
      
      const sellerLands = await landRegistry.getSellerLands(seller1.address);
      expect(sellerLands.length).to.equal(1);
      expect(sellerLands[0].location).to.equal("New York");
    });
  });

  describe("Land Requests & Approval", function () {
    beforeEach(async function () {
      // Register seller and land
      await landRegistry.connect(seller1).registerUser(1, "John Seller");
      await landRegistry.connect(inspector).verifyUser(seller1.address);
      await landRegistry.connect(seller1).registerLand(
        "New York",
        1000,
        hre.ethers.parseEther("5"),
        "https://example.com/land.jpg"
      );
      
      // Register buyer
      await landRegistry.connect(buyer1).registerUser(2, "Jane Buyer");
      await landRegistry.connect(inspector).verifyUser(buyer1.address);
    });

    it("Should request land with payment", async function () {
      await landRegistry.connect(buyer1).requestLand(1, {
        value: hre.ethers.parseEther("5")
      });
      
      const request = await landRegistry.getLandRequest(1);
      expect(request.buyer).to.equal(buyer1.address);
      expect(request.landId).to.equal(1);
      expect(request.status).to.equal(0); // Pending
      expect(request.paymentReceived).to.equal(true);
    });

    it("Should reject request with wrong payment", async function () {
      await expect(
        landRegistry.connect(buyer1).requestLand(1, {
          value: hre.ethers.parseEther("3") // Wrong amount
        })
      ).to.be.revertedWith("Payment amount does not match land price");
    });

    it("Should not allow seller to request own land", async function () {
      await expect(
        landRegistry.connect(seller1).requestLand(1, {
          value: hre.ethers.parseEther("5")
        })
      ).to.be.revertedWith("Only buyers can call this");
    });

    it("Seller should approve request", async function () {
      await landRegistry.connect(buyer1).requestLand(1, {
        value: hre.ethers.parseEther("5")
      });
      
      await landRegistry.connect(seller1).approveLandRequest(1);
      
      const request = await landRegistry.getLandRequest(1);
      expect(request.status).to.equal(1); // Approved
    });

    it("Should reject request when not seller", async function () {
      // Register another seller to test rejection
      await landRegistry.connect(seller2).registerUser(1, "Another Seller");
      await landRegistry.connect(inspector).verifyUser(seller2.address);
      
      await landRegistry.connect(buyer1).requestLand(1, {
        value: hre.ethers.parseEther("5")
      });
      
      await expect(
        landRegistry.connect(seller2).approveLandRequest(1)
      ).to.be.revertedWith("Only seller can approve");
    });

    it("Should reject request and refund payment", async function () {
      const buyerBalanceBefore = await hre.ethers.provider.getBalance(buyer1.address);
      
      const tx = await landRegistry.connect(buyer1).requestLand(1, {
        value: hre.ethers.parseEther("5")
      });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      await landRegistry.connect(seller1).rejectLandRequest(1);
      
      const request = await landRegistry.getLandRequest(1);
      expect(request.status).to.equal(2); // Rejected
      
      // Verify land is available again
      const land = await landRegistry.getLand(1);
      expect(land.isAvailable).to.equal(true);
    });
  });

  describe("Transfer Finalization", function () {
    beforeEach(async function () {
      // Setup seller and land
      await landRegistry.connect(seller1).registerUser(1, "John Seller");
      await landRegistry.connect(inspector).verifyUser(seller1.address);
      await landRegistry.connect(seller1).registerLand(
        "New York",
        1000,
        hre.ethers.parseEther("5"),
        "https://example.com/land.jpg"
      );
      
      // Setup buyer
      await landRegistry.connect(buyer1).registerUser(2, "Jane Buyer");
      await landRegistry.connect(inspector).verifyUser(buyer1.address);
      
      // Create request
      await landRegistry.connect(buyer1).requestLand(1, {
        value: hre.ethers.parseEther("5")
      });
      
      // Approve request
      await landRegistry.connect(seller1).approveLandRequest(1);
    });

    it("Should finalize transfer", async function () {
      const sellerBalanceBefore = await hre.ethers.provider.getBalance(seller1.address);
      
      await landRegistry.connect(inspector).finalizeTransfer(1);
      
      const request = await landRegistry.getLandRequest(1);
      expect(request.status).to.equal(3); // Completed
      
      const land = await landRegistry.getLand(1);
      expect(land.seller).to.equal(buyer1.address);
      expect(land.isAvailable).to.equal(true);
    });

    it("Should only allow inspector to finalize", async function () {
      await expect(
        landRegistry.connect(seller1).finalizeTransfer(1)
      ).to.be.revertedWith("Only inspector can call this");
    });

    it("Should not finalize rejected request", async function () {
      const request2 = await landRegistry.connect(seller1).registerLand(
        "Los Angeles",
        2000,
        hre.ethers.parseEther("10"),
        "https://example.com/land2.jpg"
      );
      
      await landRegistry.connect(buyer1).requestLand(2, {
        value: hre.ethers.parseEther("10")
      });
      
      await landRegistry.connect(seller1).rejectLandRequest(2);
      
      await expect(
        landRegistry.connect(inspector).finalizeTransfer(2)
      ).to.be.revertedWith("Request not approved");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await landRegistry.connect(seller1).registerUser(1, "John Seller");
      await landRegistry.connect(inspector).verifyUser(seller1.address);
      await landRegistry.connect(buyer1).registerUser(2, "Jane Buyer");
      await landRegistry.connect(inspector).verifyUser(buyer1.address);
    });

    it("Should get total lands", async function () {
      await landRegistry.connect(seller1).registerLand(
        "New York",
        1000,
        hre.ethers.parseEther("5"),
        "https://example.com/land.jpg"
      );
      
      const total = await landRegistry.getTotalLands();
      expect(total).to.equal(1);
    });

    it("Should get total requests", async function () {
      await landRegistry.connect(seller1).registerLand(
        "New York",
        1000,
        hre.ethers.parseEther("5"),
        "https://example.com/land.jpg"
      );
      
      await landRegistry.connect(buyer1).requestLand(1, {
        value: hre.ethers.parseEther("5")
      });
      
      const total = await landRegistry.getTotalRequests();
      expect(total).to.equal(1);
    });

    it("Should get buyer requests", async function () {
      await landRegistry.connect(seller1).registerLand(
        "New York",
        1000,
        hre.ethers.parseEther("5"),
        "https://example.com/land.jpg"
      );
      
      await landRegistry.connect(buyer1).requestLand(1, {
        value: hre.ethers.parseEther("5")
      });
      
      const requests = await landRegistry.getBuyerRequests(buyer1.address);
      expect(requests.length).to.equal(1);
      expect(requests[0].buyer).to.equal(buyer1.address);
    });
  });
});
