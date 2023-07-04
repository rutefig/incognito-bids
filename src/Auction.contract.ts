import {
  DeployArgs,
  Field,
  Permissions,
  SelfProof,
  SmartContract,
  State,
  method,
  state,
} from 'snarkyjs';
import { RollupState } from './Auction.rollup';

export class AuctionContract extends SmartContract {
  @state(Field) state = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method update(rollupStateProof: RollupProof) {
    const currentState = this.state.get();
    this.state.assertEquals(currentState);

    rollupStateProof.publicInput.initialRoot.assertEquals(currentState);

    rollupStateProof.verify();

    this.state.set(rollupStateProof.publicInput.latestRoot);
  }
}

type RollupProof = SelfProof<RollupState, undefined>;
