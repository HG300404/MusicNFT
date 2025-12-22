const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MusicNFT Contract", function () {
    let musicNFT;
    let owner;
    let user1;
    let user2;
    const MINT_PRICE = ethers.parseEther("0.001");
    const ROYALTY_FEE = 500; // 5%

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const MusicNFT = await ethers.getContractFactory("MusicNFT");
        musicNFT = await MusicNFT.deploy(
            owner.address,  // defaultRoyaltyReceiver
            ROYALTY_FEE,    // defaultRoyaltyFee
            MINT_PRICE      // initialMintPrice
        );
        await musicNFT.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await musicNFT.owner()).to.equal(owner.address);
        });

        it("Should set the correct mint price", async function () {
            expect(await musicNFT.mintPrice()).to.equal(MINT_PRICE);
        });

        it("Should set the correct name and symbol", async function () {
            expect(await musicNFT.name()).to.equal("MusicNFT AI");
            expect(await musicNFT.symbol()).to.equal("MNFT");
        });
    });

    describe("Minting", function () {
        const tokenURI = "ipfs://QmTestHash123";

        it("Should allow owner to mint for free", async function () {
            await expect(
                musicNFT.connect(owner).mintMusic(
                    user1.address,
                    tokenURI,
                    user1.address,
                    ROYALTY_FEE
                )
            ).to.not.be.reverted;

            expect(await musicNFT.ownerOf(1)).to.equal(user1.address);
        });

        it("Should allow user to mint with payment", async function () {
            await expect(
                musicNFT.connect(user1).mintMusic(
                    user1.address,
                    tokenURI,
                    user1.address,
                    ROYALTY_FEE,
                    { value: MINT_PRICE }
                )
            ).to.not.be.reverted;

            expect(await musicNFT.ownerOf(1)).to.equal(user1.address);
        });

        it("Should reject mint with insufficient payment", async function () {
            const insufficientPayment = ethers.parseEther("0.0005");

            await expect(
                musicNFT.connect(user1).mintMusic(
                    user1.address,
                    tokenURI,
                    user1.address,
                    ROYALTY_FEE,
                    { value: insufficientPayment }
                )
            ).to.be.revertedWith("Insufficient payment");
        });

        it("Should emit MusicMinted event", async function () {
            await expect(
                musicNFT.connect(user1).mintMusic(
                    user1.address,
                    tokenURI,
                    user1.address,
                    ROYALTY_FEE,
                    { value: MINT_PRICE }
                )
            )
                .to.emit(musicNFT, "MusicMinted")
                .withArgs(user1.address, 1, tokenURI, user1.address, ROYALTY_FEE);
        });

        it("Should set correct tokenURI", async function () {
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            expect(await musicNFT.tokenURI(1)).to.equal(tokenURI);
        });

        it("Should increment token IDs correctly", async function () {
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            await musicNFT.connect(user2).mintMusic(
                user2.address,
                tokenURI,
                user2.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            expect(await musicNFT.ownerOf(1)).to.equal(user1.address);
            expect(await musicNFT.ownerOf(2)).to.equal(user2.address);
        });
    });

    describe("Mint Price Management", function () {
        it("Should allow owner to update mint price", async function () {
            const newPrice = ethers.parseEther("0.002");

            await expect(musicNFT.connect(owner).setMintPrice(newPrice))
                .to.emit(musicNFT, "MintPriceUpdated")
                .withArgs(MINT_PRICE, newPrice);

            expect(await musicNFT.mintPrice()).to.equal(newPrice);
        });

        it("Should reject non-owner from updating mint price", async function () {
            const newPrice = ethers.parseEther("0.002");

            await expect(
                musicNFT.connect(user1).setMintPrice(newPrice)
            ).to.be.reverted;
        });

        it("Should allow setting mint price to zero", async function () {
            await musicNFT.connect(owner).setMintPrice(0);
            expect(await musicNFT.mintPrice()).to.equal(0);

            // User should be able to mint for free now
            await expect(
                musicNFT.connect(user1).mintMusic(
                    user1.address,
                    "ipfs://test",
                    user1.address,
                    ROYALTY_FEE,
                    { value: 0 }
                )
            ).to.not.be.reverted;
        });
    });

    describe("Withdraw", function () {
        const tokenURI = "ipfs://QmTestHash123";

        it("Should allow owner to withdraw funds", async function () {
            // User mints, sending ETH to contract
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            const contractBalance = await ethers.provider.getBalance(
                await musicNFT.getAddress()
            );
            expect(contractBalance).to.equal(MINT_PRICE);

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

            const tx = await musicNFT.connect(owner).withdraw();
            const receipt = await tx.wait();
            const gasCost = receipt.gasUsed * receipt.gasPrice;

            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

            expect(ownerBalanceAfter).to.equal(
                ownerBalanceBefore + MINT_PRICE - gasCost
            );
        });

        it("Should emit Withdrawn event", async function () {
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            await expect(musicNFT.connect(owner).withdraw())
                .to.emit(musicNFT, "Withdrawn")
                .withArgs(owner.address, MINT_PRICE);
        });

        it("Should reject withdraw when no funds", async function () {
            await expect(
                musicNFT.connect(owner).withdraw()
            ).to.be.revertedWith("No funds to withdraw");
        });

        it("Should reject non-owner from withdrawing", async function () {
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            await expect(
                musicNFT.connect(user1).withdraw()
            ).to.be.reverted;
        });
    });

    describe("Royalty", function () {
        const tokenURI = "ipfs://QmTestHash123";
        const salePrice = ethers.parseEther("1");

        it("Should return correct royalty info", async function () {
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            const [receiver, royaltyAmount] = await musicNFT.royaltyInfo(1, salePrice);

            expect(receiver).to.equal(user1.address);
            expect(royaltyAmount).to.equal(salePrice * BigInt(ROYALTY_FEE) / BigInt(10000));
        });

        it("Should support EIP-2981 interface", async function () {
            // EIP-2981 interface ID: 0x2a55205a
            expect(await musicNFT.supportsInterface("0x2a55205a")).to.be.true;
        });
    });

    describe("ERC721Enumerable", function () {
        const tokenURI = "ipfs://QmTestHash123";

        it("Should return correct total supply", async function () {
            expect(await musicNFT.totalSupply()).to.equal(0);

            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            expect(await musicNFT.totalSupply()).to.equal(1);

            await musicNFT.connect(user2).mintMusic(
                user2.address,
                tokenURI,
                user2.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            expect(await musicNFT.totalSupply()).to.equal(2);
        });

        it("Should return token by index", async function () {
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            await musicNFT.connect(user2).mintMusic(
                user2.address,
                tokenURI,
                user2.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            expect(await musicNFT.tokenByIndex(0)).to.equal(1);
            expect(await musicNFT.tokenByIndex(1)).to.equal(2);
        });

        it("Should return token of owner by index", async function () {
            // Mint 2 NFTs for user1
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI + "2",
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            // Mint 1 NFT for user2
            await musicNFT.connect(user2).mintMusic(
                user2.address,
                tokenURI + "3",
                user2.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            // Check user1 has 2 NFTs
            expect(await musicNFT.balanceOf(user1.address)).to.equal(2);
            expect(await musicNFT.tokenOfOwnerByIndex(user1.address, 0)).to.equal(1);
            expect(await musicNFT.tokenOfOwnerByIndex(user1.address, 1)).to.equal(2);

            // Check user2 has 1 NFT
            expect(await musicNFT.balanceOf(user2.address)).to.equal(1);
            expect(await musicNFT.tokenOfOwnerByIndex(user2.address, 0)).to.equal(3);
        });

        it("Should update enumeration after transfer", async function () {
            // Mint NFT for user1
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            expect(await musicNFT.balanceOf(user1.address)).to.equal(1);
            expect(await musicNFT.balanceOf(user2.address)).to.equal(0);

            // Transfer to user2
            await musicNFT.connect(user1).transferFrom(
                user1.address,
                user2.address,
                1
            );

            // Check balances updated
            expect(await musicNFT.balanceOf(user1.address)).to.equal(0);
            expect(await musicNFT.balanceOf(user2.address)).to.equal(1);

            // Check user2 can query their NFT
            expect(await musicNFT.tokenOfOwnerByIndex(user2.address, 0)).to.equal(1);
        });

        it("Should revert when querying out of bounds index", async function () {
            await musicNFT.connect(user1).mintMusic(
                user1.address,
                tokenURI,
                user1.address,
                ROYALTY_FEE,
                { value: MINT_PRICE }
            );

            // Should revert when index >= balance
            await expect(
                musicNFT.tokenOfOwnerByIndex(user1.address, 1)
            ).to.be.reverted;

            // Should revert when querying user with no NFTs
            await expect(
                musicNFT.tokenOfOwnerByIndex(user2.address, 0)
            ).to.be.reverted;
        });
    });
});
