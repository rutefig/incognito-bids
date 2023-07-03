import {
  Experimental,
  Field,
  MerkleMap,
  PublicKey,
  SelfProof,
  SmartContract,
  Struct,
} from 'snarkyjs';

export class Bid extends Struct({
  amount: Field,
  bidder: PublicKey,
}) {}

export class AuctionState extends Struct({
  lastValidBid: Bid,
  biddsTreeRoot: Field,
  nullifierMapRoot: Field,
}) {}

export const Auction = Experimental.ZkProgram({
  publicOutput: AuctionState,

  methods: {
    init: {
      privateInputs: [],
      method() {
        return new AuctionState({
          lastValidBid: new Bid({
            amount: Field(0),
            bidder: PublicKey.empty(),
          }),
          biddsTreeRoot: Field(0),
          nullifierMapRoot: Field(0),
        });
      },
    },

    submitBid: {
      privateInputs: [Bid, SelfProof],
      method(bid: Bid, previousProof: SelfProof<undefined, AuctionState>) {
        previousProof.verify();

        // Check that the bid is valid - greater than the last valid bid
        // and greater than 0.
        const lastValidBid = previousProof.publicOutput.lastValidBid;
        lastValidBid.amount.assertLessThan(bid.amount);

        return new AuctionState({
          lastValidBid: bid,
          biddsTreeRoot: Field(0), // TODO
          nullifierMapRoot: Field(0), // TODO
        });
      },
    },
  },
});
