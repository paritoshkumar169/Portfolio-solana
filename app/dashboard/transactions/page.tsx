import { Suspense } from "react";
import RecentTransactions from "@/components/RecentTransactions";

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="text-white p-4">Loading transactions...</div>}>
      <RecentTransactions />
    </Suspense>
  );
}
