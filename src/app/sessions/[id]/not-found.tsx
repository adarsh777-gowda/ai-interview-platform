import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SessionNotFound() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-bold">Session not found</h1>
      <p className="text-muted-foreground">This session does not exist or you do not have access.</p>
      <Link href="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
