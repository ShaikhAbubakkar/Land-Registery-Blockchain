import { expect } from "chai";
import hre from "hardhat";

describe("LandRegistry Contract", function () {
  let landRegistry;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await hre.ethers.getSigners();
    
    const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.waitForDeployment();
  });

  describe("Land Registration", function () {
    it("Should register a new land", async function () {
      await landRegistry.registerLand("New York", 1000);
      
      const land = await landRegistry.getLand(1);
      expect(land.location).to.equal("New York");
      expect(land.area).to.equal(1000);
      expect(land.currentOwner).to.equal(owner.address);
      expect(land.id).to.equal(1);
    });

    it("Should reject registering land with zero area", async function () {
      await expect(
        landRegistry.registerLand("Invalid Land", 0)
      ).to.be.revertedWith("Area must be greater than zero");
    });

    it("Should reject registering land with empty location", async function () {
      await expect(
        landRegistry.registerLand("", 500)
      ).to.be.revertedWith("Location cannot be empty");
    });

    it("Should increment land counter correctly", async function () {
      await landRegistry.registerLand("Land 1", 500);
      await landRegistry.registerLand("Land 2", 600);
      
      const totalLands = await landRegistry.getTotalLands();
      expect(totalLands).to.equal(2);
    });
  });

  describe("Ownership Transfer", function () {
    beforeEach(async function () {
      await landRegistry.registerLand("Test Land", 1000);
    });

    it("Should transfer ownership successfully", async function () {
      await landRegistry.transferOwnership(1, addr1.address);
      
      const land = await landRegistry.getLand(1);
      expect(land.currentOwner).to.equal(addr1.address);
    });

    it("Should reject transfer from non-owner", async function () {
      await expect(
        landRegistry.connect(addr1).transferOwnership(1, addr2.address)
      ).to.be.revertedWith("Only current owner can transfer");
    });

    it("Should reject transfer to invalid address", async function () {
      await expect(
        landRegistry.transferOwnership(1, hre.ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid new owner address");
    });

    it("Should reject transfer to same owner", async function () {
      await expect(
        landRegistry.transferOwnership(1, owner.address)
      ).to.be.revertedWith("Cannot transfer to yourself");
    });

    it("Should reject transfer with invalid land ID", async function () {
      await expect(
        landRegistry.transferOwnership(999, addr1.address)
      ).to.be.revertedWith("Invalid land ID");
    });
  });

  describe("Get Land Details", function () {
    beforeEach(async function () {
      await landRegistry.registerLand("Test Land", 1000);
    });

    it("Should retrieve land details", async function () {
      const land = await landRegistry.getLand(1);
      expect(land.location).to.equal("Test Land");
      expect(land.area).to.equal(1000);
    });

    it("Should reject getting invalid land", async function () {
      await expect(
        landRegistry.getLand(999)
      ).to.be.revertedWith("Invalid land ID");
    });
  });

  describe("Ownership History", function () {
    beforeEach(async function () {
      await landRegistry.registerLand("History Land", 2000);
    });

    it("Should record initial ownership", async function () {
      const history = await landRegistry.getOwnershipHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].owner).to.equal(owner.address);
    });

    it("Should record ownership transfers in history", async function () {
      await landRegistry.transferOwnership(1, addr1.address);
      await landRegistry.connect(addr1).transferOwnership(1, addr2.address);
      
      const history = await landRegistry.getOwnershipHistory(1);
      expect(history.length).to.equal(3);
      expect(history[0].owner).to.equal(owner.address);
      expect(history[1].owner).to.equal(addr1.address);
      expect(history[2].owner).to.equal(addr2.address);
    });
  });

  describe("Get Lands by Owner", function () {
    it("Should return all lands owned by an address", async function () {
      await landRegistry.registerLand("Land 1", 500);
      await landRegistry.registerLand("Land 2", 600);
      await landRegistry.registerLand("Land 3", 700);
      
      const ownerLands = await landRegistry.getLandsByOwner(owner.address);
      expect(ownerLands.length).to.equal(3);
      expect(ownerLands[0].location).to.equal("Land 1");
      expect(ownerLands[1].location).to.equal("Land 2");
      expect(ownerLands[2].location).to.equal("Land 3");
    });

    it("Should return empty array for address with no lands", async function () {
      const ownerLands = await landRegistry.getLandsByOwner(addr1.address);
      expect(ownerLands.length).to.equal(0);
    });
  });
});
