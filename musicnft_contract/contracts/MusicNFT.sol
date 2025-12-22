// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MusicNFT
 * @notice ERC-721 contract dành cho MusicNFT-AI với hỗ trợ royalty chuẩn EIP-2981.
 *         Chỉ chủ sở hữu contract (backend) được quyền mint để đồng bộ với flow FE.
 */
contract MusicNFT is ERC721URIStorage, ERC721Enumerable, ERC2981, Ownable {
    /// @dev counter tokenId, bắt đầu từ 1.
    uint256 private _tokenIds;

    /// @dev Giới hạn royalty fee để ngăn cấu hình sai (10% nếu denominator = 10000).
    uint96 public constant MAX_ROYALTY_FEE = 1000;

    /// @dev Giá mint NFT (wei). Owner có thể thay đổi.
    uint256 public mintPrice;

    event MusicMinted(
        address indexed to,
        uint256 indexed tokenId,
        string tokenURI,
        address indexed royaltyReceiver,
        uint96 royaltyFee
    );

    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(
        address defaultRoyaltyReceiver,
        uint96 defaultRoyaltyFee,
        uint256 initialMintPrice
    )
        ERC721("MusicNFT AI", "MNFT")
        Ownable(msg.sender)
    {
        if (defaultRoyaltyReceiver != address(0)) {
            _validateRoyalty(defaultRoyaltyFee);
            _setDefaultRoyalty(defaultRoyaltyReceiver, defaultRoyaltyFee);
        }
        mintPrice = initialMintPrice;
    }

    /**
     * @notice Mint NFT nhạc mới, metadata đã được upload lên IPFS (tokenURI).
     * @dev Người dùng phải trả mintPrice để mint. Owner có thể mint miễn phí.
     * @param to Ví nhận NFT.
     * @param metadataURI URI metadata chuẩn ERC-721.
     * @param royaltyReceiver Ví nhận royalty (nếu 0 => dùng default).
     * @param royaltyFee Royalty numerator (base 10000). 500 => 5%.
     */
    function mintMusic(
        address to,
        string calldata metadataURI,
        address royaltyReceiver,
        uint96 royaltyFee
    ) external payable returns (uint256) {
        // Chỉ owner được mint miễn phí, người khác phải trả phí
        if (msg.sender != owner()) {
            require(msg.value >= mintPrice, "Insufficient payment");
        }
        require(to != address(0), "Invalid recipient");

        _tokenIds += 1;
        uint256 newTokenId = _tokenIds;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        if (royaltyReceiver != address(0)) {
            _validateRoyalty(royaltyFee);
            _setTokenRoyalty(newTokenId, royaltyReceiver, royaltyFee);
        }

        emit MusicMinted(to, newTokenId, metadataURI, royaltyReceiver, royaltyFee);
        return newTokenId;
    }

    /**
     * @notice Chủ contract cập nhật royalty mặc định (áp dụng cho token chưa set riêng).
     */
    function updateDefaultRoyalty(address receiver, uint96 feeNumerator)
        external
        onlyOwner
    {
        if (receiver == address(0)) {
            _deleteDefaultRoyalty();
        } else {
            _validateRoyalty(feeNumerator);
            _setDefaultRoyalty(receiver, feeNumerator);
        }
    }

    function _validateRoyalty(uint96 fee) private pure {
        require(fee <= MAX_ROYALTY_FEE, "Royalty too high");
    }

    /**
     * @notice Cập nhật giá mint NFT.
     * @param newPrice Giá mới (wei).
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @notice Rút toàn bộ ETH trong contract về ví owner.
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
        
        emit Withdrawn(owner(), balance);
    }


    // === Overrides cần thiết cho kế thừa diamond ===

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = super._update(to, tokenId, auth);
        if (to == address(0)) {
            _resetTokenRoyalty(tokenId);
        }
        return from;
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
}
