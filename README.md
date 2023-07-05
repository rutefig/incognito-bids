# Mina zkApp: Incognito Bids

For this hackathon we tried to implement a private auctions rollup, in order to use recursion for all of the bids in an auction. Our idea was also to make the bids with private values, but we didn't have time to make sure that was really working.

- We implemented a zkProgram that implements the rollup using recursion
- We implemented the zkApp that uses the zkProgram to update Mina Network
- We implemented some tests with the first implementation of the zkProgram

## How to build

```sh
npm run build
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## License

[MIT](LICENSE)
