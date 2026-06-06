'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { JobStatus } from '@/types';

interface AddJobModalProps {
  onAdd: (job: { title: string; company: string; status: JobStatus; url?: string; description?: string }) => Promise<void>;
}

export function AddJobModal({ onAdd }: AddJobModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    url: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onAdd({ ...formData, status: 'wishlist' });
    setLoading(false);
    setOpen(false);
    setFormData({ title: '', company: '', url: '', description: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="rounded-full shadow-lg hover:shadow-xl transition-all font-bold tracking-tight">
            <Plus className="mr-2 h-4 w-4" /> Add Job
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">Add New Job</DialogTitle>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Pipeline Entry</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Job Title</label>
              <Input 
                required 
                placeholder="e.g. Software Engineer" 
                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400 transition-all font-medium"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Company</label>
              <Input 
                required 
                placeholder="e.g. Google" 
                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400 transition-all font-medium"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Job URL</label>
              <Input 
                placeholder="https://linkedin.com/jobs/..." 
                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400 transition-all font-medium"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Job Description / Notes</label>
              <Textarea 
                placeholder="Paste the job description here..." 
                className="min-h-[200px] bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400 transition-all font-medium resize-none p-4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </form>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="submit" onClick={handleSubmit} className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs" disabled={loading}>
            {loading ? 'Adding...' : 'Add Job to Wishlist'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
