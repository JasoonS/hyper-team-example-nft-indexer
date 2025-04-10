/*
import assert from "assert";
import { 
  TestHelpers,
  Marketplace_ContractBlocked
} from "generated";
const { MockDb, Marketplace } = TestHelpers;

describe("Marketplace contract ContractBlocked event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Marketplace contract ContractBlocked event
  const event = Marketplace.ContractBlocked.createMockEvent({
  // It mocks event fields with default values. You can overwrite them if you need
  });

it("Marketplace_ContractBlocked is created correctly", async () => {
  // Processing the event
  const mockDbUpdated = await Marketplace.ContractBlocked.processEvent({
    event,
    mockDb,
  });

  // Getting the actual entity from the mock database
  let actualMarketplaceContractBlocked = mockDbUpdated.entities.Marketplace_ContractBlocked.get(
    `${event.chainId}_${event.block.number}_${event.logIndex}`
  );

  // Creating the expected entity
  const expectedMarketplaceContractBlocked: Marketplace_ContractBlocked = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    nftContract: event.params.nftContract,
    blocked: event.params.blocked,
  };
  // Asserting that the entity in the mock database is the same as the expected entity
  assert.deepEqual(actualMarketplaceContractBlocked, expectedMarketplaceContractBlocked, "Actual MarketplaceContractBlocked should be the same as the expectedMarketplaceContractBlocked");
});
});
*/
