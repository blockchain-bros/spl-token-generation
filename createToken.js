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
  new Uint8Array(JSON.parse(process.env.WALLET)),
);

const userWalletSigner = createSignerFromKeypair(umi, userWallet);

const sdrive = new SDrive(process.env.SDRIVE_API_KEY);
sdrive.network = "ipfs";
const imageURI = await sdrive.upload("images/token.png","token.png");
const tokenName = "NAME";
const tokenSymbol = "SYM";
const tokenDescription = "DESCRIPTION";
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
  amount: 1000000_00000000,
  tokenOwner: userWallet.publicKey,
  tokenStandard: TokenStandard.Fungible,
})
  .sendAndConfirm(umi)
  .then(() => {
    console.log("Successfully minted 1 million tokens (", mint.publicKey, ")");
  });
