import {
  Experimental,
  Field,
  MerkleMap,
  PublicKey,
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
  },
});
