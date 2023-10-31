const { expect } =require( 'chai');
const { ethers } =require( 'hardhat');

const etherTokens =(n)=>{
    return ethers.parseUnits(n.toString(),'ether')
}


describe('RealEstate', ()=>{
    let realEstatePropertyNft, escrow
    let deployer, seller, buyer
    let nftID = 1;
    let purchasePrice = etherTokens(100)
    let escrowAmount = etherTokens(20)
 

   beforeEach(async ()=>{
    // setup accounts

    accounts = await ethers.getSigners()

    deployer = accounts[0]
    seller =deployer
    buyer =accounts[1]
    inspector =accounts[2]
    lender =accounts[3]
    const RealEstate = await ethers.getContractFactory('RealEstate')
    const MySimulatedEscrow = await ethers.getContractFactory('MySimulatedEscrow')

    //    Deploy contracts

    realEstatePropertyNft = await RealEstate.deploy()
    // console.log('realEstatePropertyNft :',realEstatePropertyNft)
    // console.log('seller :',seller)
    escrow =await MySimulatedEscrow.deploy(
        realEstatePropertyNft.target,
        nftID, 
        purchasePrice,
        escrowAmount,
        seller.address,
         buyer.address,
         inspector.address,
         lender.address
    )

    // seller approves NFT Sale
    transaction = await realEstatePropertyNft.connect(seller).approve(escrow.target, nftID)
    await transaction.wait()

   }) 

    describe('Deployment', async()=>{
        it('sends an NFT to seller / deploy', async()=>{
            expect(await realEstatePropertyNft.ownerOf(nftID)).to.equal(seller.address)
        })
    })

    describe('Selling Real Estate property', async()=>{
        let balance, transaction
        it('Executes a successfull transactions', async()=>{
            // Expect seller to be the NFT owner before the sale
            expect(await realEstatePropertyNft.ownerOf(nftID)).to.equal(seller.address)


            // buyer deposits earnest
            transaction = await escrow.connect(buyer).depositEarnest({value:escrowAmount})


            // check escrow balance
            balance = await escrow.getBalance()
            console.log('balance :', ethers.formatEther(balance))


            // inspector updates status
            transaction = await escrow.connect(inspector).updateInspectionStatus(true)
            console.log('updateInspectorStatus :')
 
            // approve sale
            transaction = await escrow.connect(inspector).approveSale()
            transaction = await escrow.connect(buyer).approveSale()
            transaction = await escrow.connect(seller).approveSale()


            // lender approves the sale and sends the remaining balance
            // transaction = await lender.sendTransaction({to: escrow.address, value:etherTokens(80)})
            transaction = await escrow.connect(lender).lenderDepositRemainingPurchaseAmount({value:etherTokens(90)})
            transaction = await escrow.connect(lender).approveSale()


            //finalize sale
            transaction = await escrow.connect(buyer).transferOwnership()
            await transaction.wait()
            console.log("Buyer finalizes sale")

             // Expect buyer to be the NFT owner after the sale
             expect(await realEstatePropertyNft.ownerOf(nftID)).to.equal(buyer.address)

            //  check if seller has received the funds

            balance = await ethers.provider.getBalance(seller.address)
            console.log("Seller balance: ", ethers.formatEther(balance))
            // let aboveTransferredAmount = purchasePrice.mul(95).div(100); 
            expect(balance).to.be.above(10100)
        })
    })

})