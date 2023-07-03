import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'snarkyjs';
import { Auction, Bid } from './Auction';

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

  it('should submit a valid bid', async () => {
    const initialProof = await Auction.init();
    const bidder = PrivateKey.random();
    const bid = new Bid({
      amount: Field(10),
      bidder: bidder.toPublicKey(),
    });
    const bidProof = await Auction.submitBid(bid, initialProof);

    expect(bidProof.publicOutput.biddsTreeRoot).toStrictEqual(Field(0));
    expect(bidProof.publicOutput.nullifierMapRoot).toStrictEqual(Field(0));
    expect(bidProof.publicOutput.lastValidBid.amount).toStrictEqual(Field(10));
    expect(bidProof.publicOutput.lastValidBid.bidder).toStrictEqual(
      bidder.toPublicKey()
    );
  });

  it.only('should submit an invalid bid', async () => {
    const initialProof = await Auction.init();
    const bidder = PrivateKey.random();
    const bid = new Bid({
      amount: Field(0),
      bidder: bidder.toPublicKey(),
    });

    await expect(Auction.submitBid(bid, initialProof)).rejects.toThrow();
  });
});
