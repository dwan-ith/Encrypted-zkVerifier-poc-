import { WalletConnector } from "@/components/WalletConnector";
import { VerifierForm } from "@/components/VerifierForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-3xl font-bold text-center">Encrypted zkVerifier</h1>
        <WalletConnector />
        <VerifierForm />
      </div>
    </main>
  );
}