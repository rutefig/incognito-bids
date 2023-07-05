import {
  Experimental,
  Field,
  MerkleMapWitness,
  PublicKey,
  SelfProof,
  Struct,
} from 'snarkyjs';

export class Bid extends Struct({
  amount: Field,
  bidder: PublicKey,
}) {}

export class RollupState extends Struct({
  initialRoot: Field,
  latestRoot: Field,
}) {
  static createBid(
    initialRoot: Field,
    latestRoot: Field,
    key: Field,
    currentBid: Bid,
    nextBid: Bid,
    merkleMapWitness: MerkleMapWitness
  ) {
    // validations
    currentBid.amount.greaterThan(Field(0));
    nextBid.amount.greaterThan(Field(0));
    currentBid.amount.assertLessThan(nextBid.amount);
    currentBid.bidder.equals(nextBid.bidder).assertFalse();

    const [witnessRootBefore, witnessKey] = merkleMapWitness.computeRootAndKey(
      currentBid.amount
    );
    initialRoot.assertEquals(witnessRootBefore);
    witnessKey.assertEquals(key);
    const [witnessRootAfter, _] = merkleMapWitness.computeRootAndKey(
      nextBid.amount
    );
    latestRoot.assertEquals(witnessRootAfter);

    return new RollupState({
      initialRoot,
      latestRoot,
    });
  }

  static createMerged(state1: RollupState, state2: RollupState) {
    return new RollupState({
      initialRoot: state1.initialRoot,
      latestRoot: state2.latestRoot,
    });
  }

  static assertEquals(state1: RollupState, state2: RollupState) {
    state1.initialRoot.assertEquals(state2.initialRoot);
    state1.latestRoot.assertEquals(state2.latestRoot);
  }
}

export const Rollup = Experimental.ZkProgram({
  publicInput: RollupState,

  methods: {
    submitBid: {
      privateInputs: [Field, Field, Field, Bid, Bid, MerkleMapWitness],

      method(
        state: RollupState,
        initialRoot: Field,
        latestRoot: Field,
        key: Field,
        currentBid: Bid,
        nextBid: Bid,
        merkleMapWitness: MerkleMapWitness
      ) {
        const computedState = RollupState.createBid(
          initialRoot,
          latestRoot,
          key,
          currentBid,
          nextBid,
          merkleMapWitness
        );
        RollupState.assertEquals(computedState, state);
      },
    },

    merge: {
      privateInputs: [SelfProof, SelfProof],

      method(
        newState: RollupState,
        rollup1proof: SelfProof<RollupState, undefined>,
        rollup2proof: SelfProof<RollupState, undefined>
      ) {
        rollup1proof.verify(); // A -> B
        rollup2proof.verify(); // B -> C

        rollup1proof.publicInput.initialRoot.assertEquals(newState.initialRoot);

        rollup1proof.publicInput.latestRoot.assertEquals(
          rollup2proof.publicInput.initialRoot
        );

        rollup2proof.publicInput.latestRoot.assertEquals(newState.latestRoot);
      },
    },
  },
});
