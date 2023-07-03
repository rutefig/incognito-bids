import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'snarkyjs';
import { Auction } from './Auction';

describe('Auction', () => {
  beforeAll(async () => {
    await Auction.compile();
  });

  it('should create a new Auction', async () => {
    const initialProof = await Auction.init();

    expect(initialProof.publicOutput.biddsTreeRoot).toStrictEqual(Field(0));
    expect(initialProof.publicOutput.nullifierMapRoot).toStrictEqual(Field(0));
    expect(initialProof.publicOutput.lastValidBid.amount).toStrictEqual(
      Field(0)
    );
    expect(initialProof.publicOutput.lastValidBid.bidder).toStrictEqual(
      PublicKey.empty()
    );
  });
});
