'use client';

import { KanbanBoard } from "@/components/KanbanBoard";
import { AddJobModal } from "@/components/AddJobModal";
import { ProfileModal } from "@/components/ProfileModal";
import { useJobs } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const { addJob } = useJobs();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 md:p-8">
      <header className="flex items-center justify-between mb-12 max-w-full mx-auto px-2">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Pipeline
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            3rd Year CS Diploma | Job Application Tracker
          </p>
        </div>
        <div className="flex gap-3">
          <ProfileModal />
          <AddJobModal onAdd={async (job) => { await addJob(job); }} />
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={handleLogout} title="Log out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-full mx-auto">
        <KanbanBoard />
      </main>
    </div>
  );
}
