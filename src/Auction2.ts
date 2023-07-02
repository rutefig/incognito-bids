import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  AccountUpdate,
  SelfProof,
  Experimental,
  Struct,
  Bool,
  Circuit,
  Poseidon,
  MerkleMap,
  MerkleTree,
  MerkleWitness,
  MerkleMapWitness,
  UInt64,
  verify,
} from 'snarkyjs';

// choose 4 for tree height
class MerkleWitness4 extends MerkleWitness(4) {}

// ===============================================================

async function main() {
  await isReady;

  console.log('SnarkyJS loaded');

  console.log('compiling...');

  const { verificationKey } = await Auction.compile();

  // below is sample bid amount. to be removed.
  const currentBid = UInt64.from(34);

  console.log('making proof 0');

  const biddersTree = new MerkleTree(4);
  const nullifierMap = new MerkleMap();

  // assume there is 10 bidders first
  const bidders = new Array(10).fill(null).map((_) => PrivateKey.random());
  bidders.forEach((v, i) =>
    biddersTree.setLeaf(BigInt(i), Poseidon.hash(v.toPublicKey().toFields()))
  );

  const bid1 = AuctionState.newAuction(biddersTree.getRoot());
  const proof0 = await Auction.create(bid1);

  console.log('making proof 1');

  const bidderIndex1 = 3;
  const nullifierKey1 = Poseidon.hash(bidders[bidderIndex1].toFields());
  const nullifierWitness1 = nullifierMap.getWitness(nullifierKey1);
  const bidderTreeWitness1 = new MerkleWitness4(
    biddersTree.getWitness(BigInt(bidderIndex1))
  );

  // to change below. need to define bid amount
  const bid2 = AuctionState.submitBid(
    bid1,
    currentBid,
    bidders[bidderIndex1],
    bidderTreeWitness1,
    nullifierWitness1
  );
  const proof1 = await Auction.submitBid(
    bid2,
    proof0,
    currentBid,
    bidders[bidderIndex1],
    bidderTreeWitness1,
    nullifierWitness1
  );
  nullifierMap.set(nullifierKey1, Field(1));

  console.log('making proof 2');

  const bidderIndex2 = 5;
  const nullifierKey2 = Poseidon.hash(bidders[bidderIndex2].toFields());
  const nullifierWitness2 = nullifierMap.getWitness(nullifierKey2);
  const voterTreeWitness2 = new MerkleWitness4(
    biddersTree.getWitness(BigInt(bidderIndex2))
  );

  // to change below. need to define bid amount
  const vote2 = AuctionState.submitBid(
    bid2,
    currentBid,
    bidders[bidderIndex2],
    voterTreeWitness2,
    nullifierWitness2
  );
  const proof2 = await Auction.submitBid(
    vote2,
    proof1,
    currentBid,
    bidders[bidderIndex2],
    voterTreeWitness2,
    nullifierWitness2
  );
  nullifierMap.set(nullifierKey2, Field(1));

  console.log('verifying proof 2');
  console.log(proof2.publicInput.bidAmount.toString());

  const ok = await Auction.verify(proof2);
  console.log('ok', ok);

  console.log('Shutting down');

  await shutdown();
}

// ===============================================================

class AuctionState extends Struct({
  bidAmount: Field,
  biddersTreeRoot: Field,
  nullifierMapRoot: Field,
}) {
  static newAuction(votersTreeRoot: Field) {
    const emptyMap = new MerkleMap();

    return new AuctionState({
      bidAmount: Field(0),
      biddersTreeRoot: votersTreeRoot,
      nullifierMapRoot: emptyMap.getRoot(),
    });
  }

  static submitBid(
    state: AuctionState,
    bidAmount: UInt64,
    privateKey: PrivateKey,
    bidderWitness: MerkleWitness4,
    nullifierWitness: MerkleMapWitness
  ) {
    const publicKey = privateKey.toPublicKey();

    const bidderRoot = bidderWitness.calculateRoot(
      Poseidon.hash(publicKey.toFields())
    );
    bidderRoot.assertEquals(state.biddersTreeRoot);

    let nullifier = Poseidon.hash(privateKey.toFields());

    const [nullifierRootBefore, key] = nullifierWitness.computeRootAndKey(
      Field(0)
    );
    key.assertEquals(nullifier);
    nullifierRootBefore.assertEquals(state.nullifierMapRoot);

    const [nullifierRootAfter, _] = nullifierWitness.computeRootAndKey(
      Field(1)
    );

    return new AuctionState({
      // change below code
      bidAmount: state.bidAmount.add(Circuit.if(bidAmount, Field(1), Field(0))),
      biddersTreeRoot: state.biddersTreeRoot,
      nullifierMapRoot: nullifierRootAfter,
    });
  }

  static assertInitialState(state: AuctionState) {
    state.bidAmount.assertEquals(Field(0));

    const emptyMap = new MerkleMap();
    state.nullifierMapRoot.assertEquals(emptyMap.getRoot());
  }

  static assertEquals(state1: AuctionState, state2: AuctionState) {
    state1.bidAmount.assertEquals(state2.bidAmount);
    state1.biddersTreeRoot.assertEquals(state2.biddersTreeRoot);
    state1.nullifierMapRoot.assertEquals(state2.nullifierMapRoot);
  }
}

// ===============================================================

const Auction = Experimental.ZkProgram({
  publicInput: AuctionState,

  methods: {
    create: {
      privateInputs: [],

      method(state: AuctionState) {
        AuctionState.assertInitialState(state);
      },
    },

    submitBid: {
      privateInputs: [
        SelfProof,
        UInt64,
        PrivateKey,
        MerkleWitness4,
        MerkleMapWitness,
      ],

      method(
        newState: AuctionState,
        earlierProof: SelfProof<AuctionState>,
        bidAmount: UInt64,
        bidder: PrivateKey,
        bidderWitness: MerkleWitness4,
        nullifierWitness: MerkleMapWitness
      ) {
        earlierProof.verify();
        const computedState = AuctionState.submitBid(
          earlierProof.publicInput,
          bidAmount,
          bidder,
          bidderWitness,
          nullifierWitness
        );
        AuctionState.assertEquals(computedState, newState);
      },
    },
  },
});

// ===============================================================

main();
