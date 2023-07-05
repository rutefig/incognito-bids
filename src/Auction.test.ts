import {
  Bool,
  Field,
  MerkleMapWitness,
  PrivateKey,
  PublicKey,
  Undefined,
} from 'snarkyjs';
import { Rollup, Bid } from './Auction.rollup';

describe('Auction Rollup', () => {
  beforeAll(async () => {
    await Rollup.compile();
  });

  const MOCK_INITIAL_STATE = {
    initialRoot: Field(0),
    latestRoot: Field(0),
  };

  const INITIAL_BID = new Bid({
    amount: Field(0),
    bidder: PublicKey.empty(),
  });

  it.only('should create a valid bid', async () => {
    const bidder = PrivateKey.random();
    const bid = new Bid({
      amount: Field(10),
      bidder: bidder.toPublicKey(),
    });
    const bidProof = await Rollup.submitBid(
      MOCK_INITIAL_STATE,
      Field(0),
      Field(0),
      Field(0),
      INITIAL_BID,
      bid,
      new MerkleMapWitness([Bool(true), Bool(false)], [Field(0), Field(10)])
    );

    console.log(bidProof.toJSON());
  });

  // it('should not submit a bid with an amount less than the last valid bid', async () => {
  // });

  // it('should not submit a bid with the same bidder as the last valid bid', async () => {
  // });
});
