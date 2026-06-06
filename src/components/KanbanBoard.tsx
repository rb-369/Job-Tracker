'use client';

import { useState } from 'react';
import { DragDropContext, Draggable, DropResult } from '@hello-pangea/dnd';
import { Job, JobStatus } from '@/types';
import { StrictModeDroppable } from './StrictModeDroppable';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { JobDetailsModal } from './JobDetailsModal';
import { useJobs } from '@/hooks/useJobs';
import { Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const COLUMNS: { id: JobStatus; title: string }[] = [
  { id: 'wishlist', title: 'Wishlist' },
  { id: 'applied', title: 'Applied' },
  { id: 'interviewing', title: 'Interviewing' },
  { id: 'offer', title: 'Offer' },
  { id: 'rejected', title: 'Rejected' },
];

export function KanbanBoard() {
  const { jobs, updateJobStatus, deleteJob, loading } = useJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    await updateJobStatus(draggableId, destination.droppableId as JobStatus);
  };

  const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project');

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-500">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm mb-4">
          <AlertCircle className="h-10 w-10 text-zinc-400" />
        </div>
        <h3 className="text-xl font-black uppercase italic tracking-tighter">Connection Required</h3>
        <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs font-medium">
          Please update your <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">.env.local</code> file with your Supabase credentials to unlock the board.
        </p>
      </div>
    );
  }

  if (loading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 animate-pulse">
        <Loader2 className="h-8 w-8 text-zinc-300 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mt-4">Syncing Pipeline</p>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                    {column.title}
                  </h2>
                </div>
                <Badge variant="outline" className="text-[9px] font-black px-1.5 h-4 border-zinc-200 dark:border-zinc-800">
                  {jobs.filter((j) => j.status === column.id).length}
                </Badge>
              </div>

              <StrictModeDroppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-zinc-100/30 dark:bg-zinc-900/20 border border-zinc-100/50 dark:border-zinc-800/50 rounded-[2rem] p-3 min-h-[650px] flex flex-col gap-4 transition-all duration-300"
                  >
                    {jobs
                      .filter((job) => job.status === column.id)
                      .map((job, index) => (
                        <Draggable key={job.id} draggableId={job.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedJob(job)}
                              className="relative group outline-none"
                            >
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute -top-1 -right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all z-20 rounded-full shadow-lg hover:bg-destructive hover:text-white border-none scale-75 group-hover:scale-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteJob(job.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <Card className="border-none bg-white dark:bg-zinc-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] dark:hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer rounded-2xl active:scale-[0.97] ring-1 ring-zinc-100 dark:ring-zinc-800/50 hover:ring-zinc-200 dark:hover:ring-zinc-700 overflow-hidden">
                                <CardHeader className="p-5 pb-2">
                                  <CardTitle className="text-sm font-black italic tracking-tight group-hover:text-primary transition-colors leading-tight">
                                    {job.title}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 pt-0 flex flex-col gap-3">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{job.company}</p>
                                  <div className="flex justify-between items-center">
                                    <div className="h-1 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                      <div className={`h-full bg-primary transition-all duration-500`} style={{ width: `${(COLUMNS.findIndex(c => c.id === job.status) + 1) * 20}%` }} />
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-300">Target</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </StrictModeDroppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} onDelete={deleteJob} />
    </>
  );
}
