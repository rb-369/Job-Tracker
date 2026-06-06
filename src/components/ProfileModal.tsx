'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { UserCircle, Save, FileUp, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ProfileModal() {
  const [open, setOpen] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  const fetchProfile = async () => {
    const { data } = await supabase.from('user_profiles').select('*').single();
    if (data) {
      setResumeText(data.resume_text || '');
      setTargetJobTitle(data.target_job_title || '');
      setLocation(data.location || '');
      setEmail(data.email || '');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.text) {
        setResumeText(data.text);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: existing } = await supabase.from('user_profiles').select('id').single();
    
    const profileData = {
      resume_text: resumeText,
      target_job_title: targetJobTitle,
      location: location,
      email: email,
    };

    if (existing) {
      await supabase.from('user_profiles').update(profileData).eq('id', existing.id);
    } else {
      await supabase.from('user_profiles').insert([profileData]);
    }
    
    setLoading(false);
    setOpen(false);
  };

  useEffect(() => {
    if (open) fetchProfile();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
            <UserCircle className="h-6 w-6" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase leading-none">Intelligence Profile</DialogTitle>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">Global Resume Data</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-4 group hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={parsing}
            />
            <div className="h-12 w-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <FileUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold">Upload PDF Resume</p>
              <p className="text-xs text-muted-foreground mt-1">We&apos;ll extract the text automatically</p>
            </div>
            {parsing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center rounded-2xl">
                <p className="text-xs font-black uppercase tracking-widest animate-pulse">Analyzing...</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Job Title</label>
              <Input 
                placeholder="e.g. Frontend Developer" 
                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400 transition-all font-medium"
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Location</label>
              <Input 
                placeholder="e.g. Remote, San Francisco" 
                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400 transition-all font-medium"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Notification Email</label>
              <Input 
                type="email"
                placeholder="Where to send automated job alerts..." 
                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400 transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Raw Resume Text</label>
              <span className="text-[10px] text-zinc-400 font-medium">{resumeText.length} characters</span>
            </div>
            <Textarea 
              placeholder="Experience, Skills, Projects..." 
              className="min-h-[350px] bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-zinc-400 transition-all font-medium resize-none p-6 leading-relaxed"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
        </div>

        <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
          <Button onClick={handleSave} className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving Changes...' : 'Save Intelligence Profile'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
