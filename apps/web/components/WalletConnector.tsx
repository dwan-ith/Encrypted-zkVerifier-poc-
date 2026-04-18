"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletConnector() {
  const { publicKey } = useWallet();

  return (
    <div className="flex justify-center">
      <WalletMultiButton />
      {publicKey && <p>Connected: {publicKey.toBase58().slice(0, 10)}...</p>}
    </div>
  );
}