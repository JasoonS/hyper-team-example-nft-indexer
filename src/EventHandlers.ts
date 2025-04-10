/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { Marketplace } from "generated";
import { Listing_t } from "generated/src/db/Entities.gen";

// Helper to handle timestamp
function getTimestamp(block: any): bigint {
  return BigInt(block.timestamp);
}

// Helper to create composite IDs for listings
function getListingId(nftContract: string, tokenId: bigint, seller: string): string {
  return `${nftContract.toLowerCase()}-${tokenId}-${seller.toLowerCase()}`;
}

// Helper to create NFT ID
function getNftId(nftContract: string, tokenId: bigint): string {
  return `${nftContract.toLowerCase()}-${tokenId}`;
}

// Helper function to ensure Account exists
async function getOrCreateAccount(address: string, context: any, timestamp: bigint): Promise<string> {
  const accountId = address.toLowerCase();
  const existingAccount = await context.Account.get(accountId);

  if (!existingAccount) {
    await context.Account.set({
      id: accountId,
      address: address.toLowerCase(),
      isModerator: false,
      isOwner: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  return accountId;
}

// Helper function to ensure NFTContract exists
async function getOrCreateNFTContract(contractAddress: string, context: any, timestamp: bigint): Promise<string> {
  const contractId = contractAddress.toLowerCase();
  const existingContract = await context.NFTContract.get(contractId);

  if (!existingContract) {
    await context.NFTContract.set({
      id: contractId,
      address: contractAddress.toLowerCase(),
      isBlocked: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  return contractId;
}

// Helper function to ensure NFT exists
async function getOrCreateNFT(contractAddress: string, tokenId: bigint, context: any, timestamp: bigint): Promise<string> {
  const contractId = await getOrCreateNFTContract(contractAddress, context, timestamp);
  const nftId = `${contractAddress.toLowerCase()}-${tokenId}`;
  const existingNFT = await context.NFT.get(nftId);

  if (!existingNFT) {
    await context.NFT.set({
      id: nftId,
      contract: contractId,
      tokenId: tokenId,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  return nftId;
}

// Helper function to ensure PaymentToken exists
async function getOrCreatePaymentToken(tokenAddress: string, context: any, timestamp: bigint): Promise<string> {
  const tokenId = tokenAddress.toLowerCase();
  const existingToken = await context.PaymentToken.get(tokenId);

  if (!existingToken) {
    await context.PaymentToken.set({
      id: tokenId,
      address: tokenAddress.toLowerCase(),
      isAllowed: true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  return tokenId;
}

// Helper function to get or create MarketplaceConfig
async function getOrCreateMarketplaceConfig(context: any, timestamp: bigint): Promise<void> {
  const configId = "marketplace";
  const existingConfig = await context.MarketplaceConfig.get(configId);

  if (!existingConfig) {
    // Create with default values, will be updated with correct owner later
    await context.MarketplaceConfig.set({
      id: configId,
      owner: "0x0000000000000000000000000000000000000000",
      platformFeePercentage: 0n,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
}

// ===== EVENT HANDLERS =====

Marketplace.ContractBlocked.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const nftContractId = event.params.nftContract.toLowerCase();

  // Handle the NFTContract entity
  const nftContract = await context.NFTContract.get(nftContractId);

  if (nftContract) {
    // Update existing contract
    await context.NFTContract.set({
      id: nftContractId,
      address: nftContract.address,
      isBlocked: event.params.blocked,
      createdAt: nftContract.createdAt,
      updatedAt: timestamp
    });
  } else {
    // Create new contract
    await context.NFTContract.set({
      id: nftContractId,
      address: nftContractId,
      isBlocked: event.params.blocked,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
});

Marketplace.FeesWithdrawn.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const tokenId = event.params.token.toLowerCase();

  // Ensure token exists
  const token = await context.PaymentToken.get(tokenId);
  if (!token) {
    // Create token if it doesn't exist
    await context.PaymentToken.set({
      id: tokenId,
      address: tokenId,
      isAllowed: true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Create fee withdrawal record
  const withdrawalId = `${event.block.number}-${event.logIndex}`;
  await context.FeeWithdrawal.set({
    id: withdrawalId,
    token_id: tokenId,
    platformAmount: event.params.platformAmount,
    royaltyAmount: event.params.royaltyAmount,
    timestamp: timestamp
  });
});

Marketplace.Listed.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const nftContractId = event.params.nftContract.toLowerCase();
  const sellerId = event.params.seller.toLowerCase();
  const paymentTokenId = event.params.paymentToken.toLowerCase();

  // Ensure Account exists
  const seller = await context.Account.get(sellerId);
  if (!seller) {
    await context.Account.set({
      id: sellerId,
      address: sellerId,
      isModerator: false,
      isOwner: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Ensure NFTContract exists
  const nftContract = await context.NFTContract.get(nftContractId);
  if (!nftContract) {
    await context.NFTContract.set({
      id: nftContractId,
      address: nftContractId,
      isBlocked: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Ensure NFT exists
  const nftId = getNftId(nftContractId, event.params.tokenId);
  const nft = await context.NFT.get(nftId);
  if (!nft) {
    await context.NFT.set({
      id: nftId,
      contract_id: nftContractId,
      tokenId: event.params.tokenId,
      createdAt: timestamp,
      updatedAt: timestamp,
      owner_id: undefined
    });
  }

  // Ensure PaymentToken exists
  const token = await context.PaymentToken.get(paymentTokenId);
  if (!token) {
    await context.PaymentToken.set({
      id: paymentTokenId,
      address: paymentTokenId,
      isAllowed: true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Create Listing
  const listingId = getListingId(nftContractId, event.params.tokenId, sellerId);
  await context.Listing.set({
    id: listingId,
    nft_id: nftId,
    nftContract_id: nftContractId,
    tokenId: event.params.tokenId,
    seller_id: sellerId,
    price: event.params.price,
    paymentToken_id: paymentTokenId,
    status: "ACTIVE",
    createdAt: timestamp,
    updatedAt: timestamp,
    cancelledAt: undefined,
    delistedAt: undefined,
    delistedBy_id: undefined
  });
});

Marketplace.ListingCancelled.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const nftContractId = event.params.nftContract.toLowerCase();
  const sellerId = event.params.seller.toLowerCase();

  // Get listing
  const listingId = getListingId(nftContractId, event.params.tokenId, sellerId);
  const listing = await context.Listing.get(listingId);

  if (listing) {
    // Update listing status
    await context.Listing.set({
      id: listingId,
      nft_id: listing.nft_id,
      nftContract_id: listing.nftContract_id,
      tokenId: listing.tokenId,
      seller_id: listing.seller_id,
      price: listing.price,
      paymentToken_id: listing.paymentToken_id,
      status: "CANCELLED",
      cancelledAt: timestamp,
      createdAt: listing.createdAt,
      updatedAt: timestamp,
      delistedAt: listing.delistedAt,
      delistedBy_id: listing.delistedBy_id
    });
  }
});

Marketplace.ListingDelisted.handlerWithLoader({
  loader: async ({ event, context }) => {
    // Find all Listings for the Token
    const allListingsOnToken = await context.Listing.getWhere.nftContract_id.eq(
      event.params.nftContract.toLowerCase(),
    );

    return { allListingsOnToken };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const timestamp = getTimestamp(event.block);
    const nftContractId = event.params.nftContract.toLowerCase();
    const moderatorId = event.params.moderator.toLowerCase();

    // Ensure moderator exists
    const moderator = await context.Account.get(moderatorId);
    if (!moderator) {
      await context.Account.set({
        id: moderatorId,
        address: moderatorId,
        isModerator: true,
        isOwner: false,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    // Find the active listing for this NFT/contract
    // Unfortunately still we need to do manual filtering
    for (const listing of loaderReturn.allListingsOnToken) {
      if (
        listing.tokenId.toString() === event.params.tokenId.toString() &&
        listing.status === "ACTIVE"
      ) {
        // Update the listing
        await context.Listing.set({
          id: listing.id,
          nft_id: listing.nft_id,
          nftContract_id: listing.nftContract_id,
          tokenId: listing.tokenId,
          seller_id: listing.seller_id,
          price: listing.price,
          paymentToken_id: listing.paymentToken_id,
          status: "DELISTED",
          delistedAt: timestamp,
          delistedBy_id: moderatorId,
          createdAt: listing.createdAt,
          updatedAt: timestamp,
          cancelledAt: listing.cancelledAt
        });

        break; // Only update the first active listing
      }
    }
  }
});

Marketplace.ListingPriceUpdated.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const nftContractId = event.params.nftContract.toLowerCase();
  const sellerId = event.params.seller.toLowerCase();

  // Get listing
  const listingId = getListingId(nftContractId, event.params.tokenId, sellerId);
  const listing = await context.Listing.get(listingId);

  if (listing) {
    const oldPrice = listing.price;

    // Update listing
    await context.Listing.set({
      id: listingId,
      nft_id: listing.nft_id,
      nftContract_id: listing.nftContract_id,
      tokenId: listing.tokenId,
      seller_id: listing.seller_id,
      price: event.params.newPrice,
      paymentToken_id: listing.paymentToken_id,
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: timestamp,
      cancelledAt: listing.cancelledAt,
      delistedAt: listing.delistedAt,
      delistedBy_id: listing.delistedBy_id
    });

    // Create price update
    const priceUpdateId = `${listingId}-${event.block.number}-${event.logIndex}`;
    await context.PriceUpdate.set({
      id: priceUpdateId,
      listing_id: listingId,
      oldPrice: oldPrice,
      newPrice: event.params.newPrice,
      timestamp: timestamp
    });
  }
});

Marketplace.ModeratorAdded.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const moderatorId = event.params.moderator.toLowerCase();

  // Get or create account
  const account = await context.Account.get(moderatorId);

  if (account) {
    await context.Account.set({
      id: moderatorId,
      address: account.address,
      isModerator: true,
      isOwner: account.isOwner,
      createdAt: account.createdAt,
      updatedAt: timestamp
    });
  } else {
    await context.Account.set({
      id: moderatorId,
      address: moderatorId,
      isModerator: true,
      isOwner: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
});

Marketplace.ModeratorRemoved.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const moderatorId = event.params.moderator.toLowerCase();

  // Update account
  const account = await context.Account.get(moderatorId);

  if (account) {
    await context.Account.set({
      id: moderatorId,
      address: account.address,
      isModerator: false,
      isOwner: account.isOwner,
      createdAt: account.createdAt,
      updatedAt: timestamp
    });
  }
});

Marketplace.OwnershipTransferred.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const prevOwnerId = event.params.previousOwner.toLowerCase();
  const newOwnerId = event.params.newOwner.toLowerCase();

  // Update previous owner if exists
  const prevOwner = await context.Account.get(prevOwnerId);
  if (prevOwner) {
    await context.Account.set({
      id: prevOwnerId,
      address: prevOwner.address,
      isModerator: prevOwner.isModerator,
      isOwner: false,
      createdAt: prevOwner.createdAt,
      updatedAt: timestamp
    });
  }

  // Update new owner
  const newOwner = await context.Account.get(newOwnerId);
  if (newOwner) {
    await context.Account.set({
      id: newOwnerId,
      address: newOwner.address,
      isModerator: newOwner.isModerator,
      isOwner: true,
      createdAt: newOwner.createdAt,
      updatedAt: timestamp
    });
  } else {
    await context.Account.set({
      id: newOwnerId,
      address: newOwnerId,
      isModerator: false,
      isOwner: true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Update marketplace config
  const configId = "marketplace";
  const config = await context.MarketplaceConfig.get(configId);

  if (config) {
    await context.MarketplaceConfig.set({
      id: configId,
      owner_id: newOwnerId,
      platformFeePercentage: config.platformFeePercentage,
      createdAt: config.createdAt,
      updatedAt: timestamp
    });
  } else {
    await context.MarketplaceConfig.set({
      id: configId,
      owner_id: newOwnerId,
      platformFeePercentage: 0n,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
});

Marketplace.PaymentTokenUpdated.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const tokenId = event.params.token.toLowerCase();

  // Update token
  const token = await context.PaymentToken.get(tokenId);

  if (token) {
    await context.PaymentToken.set({
      id: tokenId,
      address: token.address,
      isAllowed: event.params.allowed,
      createdAt: token.createdAt,
      updatedAt: timestamp
    });
  } else {
    await context.PaymentToken.set({
      id: tokenId,
      address: tokenId,
      isAllowed: event.params.allowed,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
});

Marketplace.PlatformFeeUpdated.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);

  // Update marketplace config
  const configId = "marketplace";
  const config = await context.MarketplaceConfig.get(configId);

  if (config) {
    await context.MarketplaceConfig.set({
      id: configId,
      owner_id: config.owner_id,
      platformFeePercentage: event.params.newFeePercentage,
      createdAt: config.createdAt,
      updatedAt: timestamp
    });
  } else {
    await context.MarketplaceConfig.set({
      id: configId,
      owner_id: "0x0000000000000000000000000000000000000000",
      platformFeePercentage: event.params.newFeePercentage,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
});

Marketplace.RoyaltyDistributed.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const nftContractId = event.params.nftContract.toLowerCase();

  // Ensure NFT Contract exists
  const nftContract = await context.NFTContract.get(nftContractId);
  if (!nftContract) {
    await context.NFTContract.set({
      id: nftContractId,
      address: nftContractId,
      isBlocked: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Ensure receiver accounts exist
  for (const receiver of event.params.receivers) {
    const receiverId = receiver.toLowerCase();
    const account = await context.Account.get(receiverId);

    if (!account) {
      await context.Account.set({
        id: receiverId,
        address: receiverId,
        isModerator: false,
        isOwner: false,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
  }

  // Create RoyaltyDistribution
  const distributionId = `${event.block.number}-${event.logIndex}`;
  await context.RoyaltyDistribution.set({
    id: distributionId,
    nftContract_id: nftContractId,
    amounts: event.params.amounts,
    timestamp: timestamp
  });
});

Marketplace.RoyaltyUpdated.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const nftContractId = event.params.nftContract.toLowerCase();

  // Ensure NFT Contract exists
  const nftContract = await context.NFTContract.get(nftContractId);
  if (!nftContract) {
    await context.NFTContract.set({
      id: nftContractId,
      address: nftContractId,
      isBlocked: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Create/update royalty receivers
  for (let i = 0; i < event.params.receivers.length; i++) {
    const receiverId = event.params.receivers[i].toLowerCase();

    // Ensure account exists
    const account = await context.Account.get(receiverId);
    if (!account) {
      await context.Account.set({
        id: receiverId,
        address: receiverId,
        isModerator: false,
        isOwner: false,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    // Create RoyaltyReceiver
    const royaltyReceiverId = `${nftContractId}-${receiverId}`;
    await context.RoyaltyReceiver.set({
      id: royaltyReceiverId,
      nftContract_id: nftContractId,
      receiver_id: receiverId,
      percentage: event.params.percentages[i],
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
});

Marketplace.Sale.handler(async ({ event, context }) => {
  const timestamp = getTimestamp(event.block);
  const nftContractId = event.params.nftContract.toLowerCase();
  const buyerId = event.params.buyer.toLowerCase();
  const sellerId = event.params.seller.toLowerCase();
  const tokenId = event.params.paymentToken.toLowerCase();

  // Ensure buyer account exists
  const buyer = await context.Account.get(buyerId);
  if (!buyer) {
    await context.Account.set({
      id: buyerId,
      address: buyerId,
      isModerator: false,
      isOwner: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Ensure seller account exists
  const seller = await context.Account.get(sellerId);
  if (!seller) {
    await context.Account.set({
      id: sellerId,
      address: sellerId,
      isModerator: false,
      isOwner: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Ensure NFT contract exists
  const nftContract = await context.NFTContract.get(nftContractId);
  if (!nftContract) {
    await context.NFTContract.set({
      id: nftContractId,
      address: nftContractId,
      isBlocked: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Ensure NFT exists and update owner
  const nftId = getNftId(nftContractId, event.params.tokenId);
  const nft = await context.NFT.get(nftId);

  if (nft) {
    await context.NFT.set({
      id: nftId,
      contract_id: nft.contract_id,
      tokenId: nft.tokenId,
      owner_id: buyerId,
      createdAt: nft.createdAt,
      updatedAt: timestamp
    });
  } else {
    await context.NFT.set({
      id: nftId,
      contract_id: nftContractId,
      tokenId: event.params.tokenId,
      owner_id: buyerId,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Ensure payment token exists
  const paymentToken = await context.PaymentToken.get(tokenId);
  if (!paymentToken) {
    await context.PaymentToken.set({
      id: tokenId,
      address: tokenId,
      isAllowed: true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // Create Sale
  const saleId = `${event.block.number}-${event.logIndex}`;
  await context.Sale.set({
    id: saleId,
    nft_id: nftId,
    nftContract_id: nftContractId,
    tokenId: event.params.tokenId,
    buyer_id: buyerId,
    seller_id: sellerId,
    price: event.params.price,
    paymentToken_id: tokenId,
    platformFee: 0n,
    royaltyFee: 0n,
    timestamp: timestamp
  });

  // Update listing status
  const listingId = getListingId(nftContractId, event.params.tokenId, sellerId);
  const listing = await context.Listing.get(listingId);

  if (listing) {
    await context.Listing.set({
      id: listingId,
      nft_id: listing.nft_id,
      nftContract_id: listing.nftContract_id,
      tokenId: listing.tokenId,
      seller_id: listing.seller_id,
      price: listing.price,
      paymentToken_id: listing.paymentToken_id,
      status: "SOLD",
      createdAt: listing.createdAt,
      updatedAt: timestamp,
      cancelledAt: listing.cancelledAt,
      delistedAt: listing.delistedAt,
      delistedBy_id: listing.delistedBy_id
    });
  }
});
