//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;


interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id ) external;
}
contract MySimulatedEscrow{
    address public nftAddress;
    uint256 public nftID;
    uint256 public purchasePrice;
    uint256 public escrowAmount;
    address payable buyer;
    address payable seller;
    address public inspector;
    address public lender;


  modifier onlyBuyer(){
    require(msg.sender == buyer, " Only buyer can perform this Action" );
       _;

}
  modifier onlyInspector(){
    require(msg.sender == inspector, " Only Inspector can perform this Action" );
       _;

}
modifier onlylender(){
    require(msg.sender == lender, " Only Lender can perform this Action" );
       _;

}

bool public inspectionPassed = false;

mapping(address =>bool) public approval;

    constructor(
        address _nftAddress, 
        uint256 _nftID, 
        uint256 _purchasePrice,
         uint256 _escrowAmount, 
         address payable _seller,
          address payable _buyer, 
          address _inspector,
           address _lender)
           {
         nftAddress = _nftAddress;
         nftID= _nftID;
        purchasePrice =_purchasePrice;
        escrowAmount = _escrowAmount;
        seller = _seller;
        buyer = _buyer;
        inspector = _inspector;
        lender = _lender;
    }

    // make the contract to recieve amount anonymously

    receive() external payable {}


    function depositEarnest() public payable onlyBuyer{
         
        require(msg.value >= escrowAmount, " Amount Needs to be equal or more than Deposit Amount" );
      

}



function updateInspectionStatus(bool _passed) public onlyInspector{
    inspectionPassed = _passed;
}

function lenderDepositRemainingPurchaseAmount ()public payable onlylender(){
    require(msg.value >= (purchasePrice - escrowAmount), " Amount Needs to be equal or more than Purchase Price Amount" );
}

function approveSale() public{
    approval[msg.sender] = true;
}

function getBalance() public view returns (uint){
    return address(this).balance;

}

    function transferOwnership() public {
        require(inspectionPassed, "Must pass Inspection");

        require(approval[buyer], 'Require Buyers Approval');
        require(approval[seller],'Require sellers Approval');
        require(approval[lender],'Require lenders Approval');
        require(approval[inspector],'Require lenders Approval');


        // check balance if is enough for the transaction
          require(address(this).balance >= purchasePrice,'Balance must be equal or greater than Purchase Price');

        //   transefer funds to seller

        (bool success,) = payable(seller).call{value: address(this).balance}("");
        
          // transfer ownership of property
          require(success);
          IERC721(nftAddress).transferFrom(seller, buyer, nftID);
    }

}