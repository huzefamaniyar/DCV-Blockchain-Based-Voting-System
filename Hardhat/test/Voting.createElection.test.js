const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helpers
const now = async () => (await ethers.provider.getBlock("latest")).timestamp;
const advanceSeconds = async (s) => {
  await ethers.provider.send("evm_increaseTime", [s]);
  await ethers.provider.send("evm_mine");
};

describe("Voting.createElection", function () {
  let Voting, voting, owner, admin, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    Voting = await ethers.getContractFactory("Voting", owner);
    voting = await Voting.deploy();
    await voting.waitForDeployment();
    admin = owner; // by constructor
  });

  it("should allow admin to create an election with valid times", async () => {
    const t = await now();
    const start = t + 60; // +1 min
    const end = start + 3600; // +1 hr

    const tx = await voting.createElection("Title", "Desc", start, end);
    const receipt = await tx.wait();

    // Event check
    const event = receipt.logs
      .map((l) => {
        try { return voting.interface.parseLog(l); } catch { return null; }
      })
      .find((e) => e && e.name === "ElectionCreated");
    expect(event).to.not.be.undefined;

    const id = await voting.electionCount();
    const info = await voting.getElection(id);

    expect(info[0]).to.equal(id); // id
    expect(info[1]).to.equal("Title"); // title
    expect(info[4]).to.equal(BigInt(end)); // endTime
  });

  it("should allow any wallet to create (no onlyAdmin on-chain)", async () => {
    const before = await voting.electionCount();
    const t = await now();
    const start = t + 60;
    const end = start + 3600;
    const votingAsUser = voting.connect(user);
    const tx = await votingAsUser.createElection("T","D",start,end);
    await tx.wait();
    const after = await voting.electionCount();
    expect(after).to.equal(before + 1n);
  });

  it("should revert if start time is not in the future", async () => {
    const t = await now();
    const start = t; // not in future
    const end = start + 3600;
    await expect(voting.createElection("T","D",start,end)).to.be.revertedWith("Start time must be in the future");
  });

  it("should revert if end time not after start time", async () => {
    const t = await now();
    const start = t + 60;
    const end = start; // not after
    await expect(voting.createElection("T","D",start,end)).to.be.revertedWith("End time must be after start time");
  });
});
