/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  Marketplace,
  Marketplace_ContractBlocked,
  Marketplace_FeesWithdrawn,
  Marketplace_Listed,
  Marketplace_ListingCancelled,
  Marketplace_ListingDelisted,
  Marketplace_ListingPriceUpdated,
  Marketplace_ModeratorAdded,
  Marketplace_ModeratorRemoved,
  Marketplace_OwnershipTransferred,
  Marketplace_PaymentTokenUpdated,
  Marketplace_PlatformFeeUpdated,
  Marketplace_RoyaltyDistributed,
  Marketplace_RoyaltyUpdated,
  Marketplace_Sale,
} from "generated";

Marketplace.ContractBlocked.handler(async ({ event, context }) => {
  const entity: Marketplace_ContractBlocked = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    nftContract: event.params.nftContract,
    blocked: event.params.blocked,
  };

  context.Marketplace_ContractBlocked.set(entity);
});

Marketplace.FeesWithdrawn.handler(async ({ event, context }) => {
  const entity: Marketplace_FeesWithdrawn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    token: event.params.token,
    platformAmount: event.params.platformAmount,
    royaltyAmount: event.params.royaltyAmount,
  };

  context.Marketplace_FeesWithdrawn.set(entity);
});

Marketplace.Listed.handler(async ({ event, context }) => {
  const entity: Marketplace_Listed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    seller: event.params.seller,
    nftContract: event.params.nftContract,
    tokenId: event.params.tokenId,
    price: event.params.price,
    paymentToken: event.params.paymentToken,
  };

  context.Marketplace_Listed.set(entity);
});

Marketplace.ListingCancelled.handler(async ({ event, context }) => {
  const entity: Marketplace_ListingCancelled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    seller: event.params.seller,
    nftContract: event.params.nftContract,
    tokenId: event.params.tokenId,
  };

  context.Marketplace_ListingCancelled.set(entity);
});

Marketplace.ListingDelisted.handler(async ({ event, context }) => {
  const entity: Marketplace_ListingDelisted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    nftContract: event.params.nftContract,
    tokenId: event.params.tokenId,
    moderator: event.params.moderator,
  };

  context.Marketplace_ListingDelisted.set(entity);
});

Marketplace.ListingPriceUpdated.handler(async ({ event, context }) => {
  const entity: Marketplace_ListingPriceUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    seller: event.params.seller,
    nftContract: event.params.nftContract,
    tokenId: event.params.tokenId,
    newPrice: event.params.newPrice,
  };

  context.Marketplace_ListingPriceUpdated.set(entity);
});

Marketplace.ModeratorAdded.handler(async ({ event, context }) => {
  const entity: Marketplace_ModeratorAdded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    moderator: event.params.moderator,
  };

  context.Marketplace_ModeratorAdded.set(entity);
});

Marketplace.ModeratorRemoved.handler(async ({ event, context }) => {
  const entity: Marketplace_ModeratorRemoved = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    moderator: event.params.moderator,
  };

  context.Marketplace_ModeratorRemoved.set(entity);
});

Marketplace.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: Marketplace_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.Marketplace_OwnershipTransferred.set(entity);
});

Marketplace.PaymentTokenUpdated.handler(async ({ event, context }) => {
  const entity: Marketplace_PaymentTokenUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    token: event.params.token,
    allowed: event.params.allowed,
  };

  context.Marketplace_PaymentTokenUpdated.set(entity);
});

Marketplace.PlatformFeeUpdated.handler(async ({ event, context }) => {
  const entity: Marketplace_PlatformFeeUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newFeePercentage: event.params.newFeePercentage,
  };

  context.Marketplace_PlatformFeeUpdated.set(entity);
});

Marketplace.RoyaltyDistributed.handler(async ({ event, context }) => {
  const entity: Marketplace_RoyaltyDistributed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    nftContract: event.params.nftContract,
    receivers: event.params.receivers,
    amounts: event.params.amounts,
  };

  context.Marketplace_RoyaltyDistributed.set(entity);
});

Marketplace.RoyaltyUpdated.handler(async ({ event, context }) => {
  const entity: Marketplace_RoyaltyUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    nftContract: event.params.nftContract,
    receivers: event.params.receivers,
    percentages: event.params.percentages,
  };

  context.Marketplace_RoyaltyUpdated.set(entity);
});

Marketplace.Sale.handler(async ({ event, context }) => {
  const entity: Marketplace_Sale = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    buyer: event.params.buyer,
    seller: event.params.seller,
    nftContract: event.params.nftContract,
    tokenId: event.params.tokenId,
    price: event.params.price,
    paymentToken: event.params.paymentToken,
  };

  context.Marketplace_Sale.set(entity);
});
