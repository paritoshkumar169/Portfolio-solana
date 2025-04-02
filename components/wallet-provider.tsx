"use client"

import { type FC, type ReactNode, useMemo, useEffect, useState } from "react"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"

// Import the wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css"

interface WalletContextProviderProps {
  children: ReactNode
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Mainnet

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  // To avoid hydration errors with Next.js
  const [mounted, setMounted] = useState(false)

  // For wallet adapters that need to be loaded only in browser
  const [wallets, setWallets] = useState<any[]>([])

  useEffect(() => {
    // This is to ensure the component is mounted only on the client side
    setMounted(true)

    // Dynamically import wallet adapters to avoid SSR issues
    const loadWallets = async () => {
      const { PhantomWalletAdapter, SolflareWalletAdapter} = await import(
        "@solana/wallet-adapter-wallets"
      )

      setWallets([
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
       
      ])
    }

    loadWallets()
  }, [network])

  // To avoid hydration errors with Next.js
  if (!mounted) return <>{children}</>

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

