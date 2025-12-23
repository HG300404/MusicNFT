const hre = require("hardhat");
const MusicNFTData = require("../frontend/MusicNFT.json");

async function main() {
  const contractAddress = MusicNFTData.contractAddress;
  const abi = MusicNFTData.abi;
  const tokenId = 2;

  console.log(`Checking status for Token ID ${tokenId} at contract ${contractAddress}...`);

  const [signer] = await hre.ethers.getSigners();
  const contract = new hre.ethers.Contract(contractAddress, abi, signer);

  try {
    const owner = await contract.ownerOf(tokenId);
    console.log(`Token ${tokenId} owner: ${owner}`);
    
    const uri = await contract.tokenURI(tokenId);
    console.log(`FULL_TOKEN_URI:${uri}`);

    const totalSupply = await contract.totalSupply();
    console.log(`Total Supply: ${totalSupply.toString()}`);
  } catch (error) {
    if (error.message.includes("ERC721NonexistentToken")) {
      console.log(`Token ${tokenId} does not exist yet.`);
    } else {
      console.error("Error checking token:", error.message);
    }
    
    try {
        const totalSupply = await contract.totalSupply();
        console.log(`Total Supply: ${totalSupply.toString()}`);
    } catch (e) {
        console.log("Could not fetch totalSupply");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
