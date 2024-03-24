import "dotenv/config";
import {
  percentAmount,
  generateSigner,
  signerIdentity,
  createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import {
  TokenStandard,
  createAndMint,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import "@solana/web3.js";
import { SDrive } from "sdrive";

const umi = createUmi(process.env.QUICKNODE_RPC);

const userWallet = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(JSON.parse(process.env.PRIVATE_KEY)),
);

const userWalletSigner = createSignerFromKeypair(umi, userWallet);

const sdrive = new SDrive(process.env.SDRIVE_API_KEY);
sdrive.network = "ipfs";

const image = process.env.TOKEN_IMAGE;

const imageURI = await sdrive.upload(image,"token.png");
const tokenName = process.env.TOKEN_NAME;
const tokenSymbol = process.env.TOKEN_SYMBOL;
const tokenDescription = process.env.TOKEN_DESCRIPTION;
const tokenImage = imageURI.permalink; 
const metadata = Buffer.from(
  JSON.stringify({
    name: tokenName,
    symbol: tokenSymbol,
    description: tokenDescription,
    image: tokenImage,
  }),
  "utf8",
);

const tokenURI = await sdrive.upload(metadata, "token.json");

const tokenAmount = process.env.TOKEN_AMOUNT;

const mint = generateSigner(umi);
umi.use(signerIdentity(userWalletSigner));
umi.use(mplCandyMachine());

createAndMint(umi, {
  mint,
  authority: umi.identity,
  name: tokenName,
  symbol: tokenSymbol,
  uri: tokenURI.permalink,
  sellerFeeBasisPoints: percentAmount(0),
  decimals: 8,
  amount: tokenAmount*1e8,
  tokenOwner: userWallet.publicKey,
  tokenStandard: TokenStandard.Fungible,
})
  .sendAndConfirm(umi)
  .then(() => {
    console.log("Successfully minted 1 million tokens (", mint.publicKey, ")");
  });
