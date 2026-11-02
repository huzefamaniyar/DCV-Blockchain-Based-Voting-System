// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    enum ElectionStatus { UPCOMING, ACTIVE, CLOSED }

    struct Candidate {
        uint256 id;
        string name;
        string imageUrl;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        ElectionStatus status;
        bool exists;
    }

    mapping(uint256 => Election) public elections;
    mapping(uint256 => Candidate[]) public candidates;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(string => bool)) private aadharVoted;
    
    uint256 public electionCount;
    address public admin;

    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event ElectionStatusChanged(uint256 indexed electionId, ElectionStatus status);
    event VoteCasted(uint256 indexed electionId, uint256 candidateId, address voter);
    event CandidateAdded(uint256 indexed electionId, uint256 candidateId, string name);

    address public owner;
    bool private locked;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier validElection(uint256 _electionId) {
        require(elections[_electionId].exists, "Election does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        admin = msg.sender;
    }

    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external returns (uint256) {
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");

        electionCount++;
        
        elections[electionCount] = Election({
            id: electionCount,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            status: ElectionStatus.UPCOMING,
            exists: true
        });

        emit ElectionCreated(electionCount, _title, _startTime, _endTime);
        return electionCount;
    }

    function addCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _imageUrl
    ) external validElection(_electionId) {
        require(elections[_electionId].status == ElectionStatus.UPCOMING, "Can only add candidates to upcoming elections");
        
        uint256 candidateId = candidates[_electionId].length;
        candidates[_electionId].push(Candidate({
            id: candidateId,
            name: _name,
            imageUrl: _imageUrl,
            voteCount: 0
        }));

        emit CandidateAdded(_electionId, candidateId, _name);
    }

    function vote(uint256 _electionId, uint256 _candidateId, string memory _aadhar) 
        external 
        nonReentrant 
        validElection(_electionId) 
    {
        Election storage election = elections[_electionId];
        require(block.timestamp >= election.startTime, "Voting has not started");
        require(block.timestamp <= election.endTime, "Voting has ended");
        require(election.status == ElectionStatus.ACTIVE, "Election is not active");
        require(!hasVoted[_electionId][msg.sender], "Already voted in this election");
        require(!aadharVoted[_electionId][_aadhar], "This Aadhar has already voted");
        require(_candidateId < candidates[_electionId].length, "Invalid candidate");

        // Update voting status
        hasVoted[_electionId][msg.sender] = true;
        aadharVoted[_electionId][_aadhar] = true;
        
        // Record the vote
        candidates[_electionId][_candidateId].voteCount++;

        emit VoteCasted(_electionId, _candidateId, msg.sender);
    }

    function updateElectionStatus(uint256 _electionId) external validElection(_electionId) {
        Election storage election = elections[_electionId];
        
        if (block.timestamp >= election.startTime && block.timestamp <= election.endTime) {
            require(election.status != ElectionStatus.ACTIVE, "Election is already active");
            election.status = ElectionStatus.ACTIVE;
        } else if (block.timestamp > election.endTime) {
            require(election.status != ElectionStatus.CLOSED, "Election is already closed");
            election.status = ElectionStatus.CLOSED;
        } else {
            revert("Cannot update status at this time");
        }

        emit ElectionStatusChanged(_electionId, election.status);
    }

    function deleteElection(uint256 _electionId) external onlyAdmin validElection(_electionId) {
        Election storage election = elections[_electionId];
        require(
            election.status == ElectionStatus.UPCOMING || election.status == ElectionStatus.CLOSED,
            "Cannot delete active election"
        );
        
        delete elections[_electionId];
        delete candidates[_electionId];
    }

    // View functions
    function getElection(uint256 _electionId) external view validElection(_electionId) returns (
        uint256 id,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        ElectionStatus status,
        uint256 candidateCount
    ) {
        Election storage e = elections[_electionId];
        return (
            e.id,
            e.title,
            e.description,
            e.startTime,
            e.endTime,
            e.status,
            candidates[_electionId].length
        );
    }

    function getCandidates(uint256 _electionId) external view validElection(_electionId) returns (Candidate[] memory) {
        return candidates[_electionId];
    }

    function hasUserVoted(uint256 _electionId, address _voter) external view validElection(_electionId) returns (bool) {
        return hasVoted[_electionId][_voter];
    }

    // Admin functions
    function setAdmin(address _newAdmin) external onlyOwner {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
    }

    // Utility view function expected by server
    function getTotalElections() external view returns (uint256) {
        return electionCount;
    }
}
