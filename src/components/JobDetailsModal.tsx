'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Job, GenerateKitResponse, ChatMessage } from '@/types';
import { Sparkles, FileText, Briefcase, HelpCircle, Building, ExternalLink, Trash2, MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface JobDetailsModalProps {
  job: Job | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function JobDetailsModal({ job, onClose, onDelete }: JobDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<GenerateKitResponse | null>(null);
  const [activeTab, setActiveTab] = useState('description');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (job) {
      setKit(null);
      setActiveTab('description');
      setMessages([]);
      setApiError(null);
      loadJobData();
    }
  }, [job?.id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const loadJobData = async () => {
    if (!job) return;
    try {
      // 1. Fetch Intel Kit
      const { data: jobData } = await supabase.from('jobs').select('intel_kit').eq('id', job.id).single();
      if (jobData?.intel_kit) {
        setKit(jobData.intel_kit);
      }

      // 2. Fetch Chat History
      const response = await fetch(`/api/chat?jobId=${job.id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load job data', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !job || chatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    setApiError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, message: userMsg }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      // Remove the optimistic user message if the request failed
      setMessages(prev => prev.slice(0, -1));
      // Display the error inside the chat UI
      setMessages(prev => [...prev, { role: 'system', content: `[ERROR]: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const generateKit = async () => {
    if (!job) return;
    setLoading(true);
    try {
      const response = await fetch('/api/generate-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, description: job.description }),
      });
      const data = await response.json();
      setKit(data);
      setActiveTab('cover-letter');
    } catch (err) {
      console.error('Error generating kit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (job) {
      await onDelete(job.id);
      onClose();
    }
  };

  if (!job) return null;

  return (
    <Dialog open={!!job} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-black">
        <DialogHeader className="p-8 pb-6 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase leading-none">{job.title}</DialogTitle>
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-primary transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{job.company}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={generateKit} disabled={loading} className="rounded-xl font-bold uppercase tracking-widest text-xs px-6 h-10 shadow-lg">
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? 'Analyzing...' : kit ? 'Regenerate Intel Kit' : 'Generate Intel Kit'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 relative flex flex-col">
          {apiError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-destructive">Generation Failed</h4>
                <p className="text-xs text-destructive/80 font-medium mt-1">{apiError}</p>
              </div>
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full flex-1">
            <TabsList className={`grid w-full bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl h-12 shrink-0 ${kit ? 'grid-cols-6' : 'grid-cols-2'}`}>
              <TabsTrigger value="description" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:shadow-sm transition-all">
                <FileText className="h-3.5 w-3.5 mr-2" /> Description
              </TabsTrigger>
              <TabsTrigger value="chat" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:shadow-sm transition-all">
                <MessageSquare className="h-3.5 w-3.5 mr-2" /> Coach AI
              </TabsTrigger>
              {kit && (
                <>
                  <TabsTrigger value="cover-letter" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:shadow-sm transition-all">
                    Letter
                  </TabsTrigger>
                  <TabsTrigger value="resume-bullets" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:shadow-sm transition-all">
                    Bullets
                  </TabsTrigger>
                  <TabsTrigger value="interview" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:shadow-sm transition-all">
                    Prep
                  </TabsTrigger>
                  <TabsTrigger value="brief" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:shadow-sm transition-all">
                    Brief
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="description" className="mt-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800/50 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-none ring-1 ring-black/[0.02] dark:ring-white/[0.02]">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Target Overview</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Provided Description</p>
                  </div>
                </div>
                <div className="text-sm leading-loose whitespace-pre-wrap font-medium text-muted-foreground">
                  {job.description || <span className="italic text-zinc-400">No description provided for this target. The intelligence kit will be generated using only the job title and company name.</span>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-8 flex-1 flex flex-col min-h-[400px] animate-in fade-in zoom-in-95 duration-200">
               <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 p-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground" />
                      <p className="text-sm font-bold text-muted-foreground">Start a conversation with your Career Coach AI.</p>
                      <p className="text-xs text-muted-foreground/80 max-w-[250px]">Ask for YouTube tutorials, interview questions, or resume tailoring specific to this role.</p>
                    </div>
                  ) : (
                    messages.filter(m => (m.role !== 'system' || m.content.startsWith('[ERROR]')) && !m.content.includes("You are an expert career coach") && !m.content.includes("You are an elite career coach")).map((msg, i) => {
                      const isModel = msg.role === 'model';
                      const isError = msg.role === 'system' && msg.content.startsWith('[ERROR]');
                      // Skip the dummy acknowledgement message
                      if (isModel && msg.content.includes('Understood. I am ready to act as the career coach.')) return null;

                      return (
                        <div key={i} className={`flex gap-4 ${isModel || isError ? '' : 'flex-row-reverse'}`}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isError ? 'bg-destructive/10 text-destructive' : isModel ? 'bg-primary/10 text-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                            {isError ? <AlertCircle className="h-4 w-4" /> : isModel ? <Sparkles className="h-4 w-4" /> : <div className="h-4 w-4 bg-zinc-400 rounded-full" />}
                          </div>
                          <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap font-medium ${isError ? 'bg-destructive/10 border border-destructive/20 text-destructive' : isModel ? 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800' : 'bg-primary text-primary-foreground'}`}>
                            {msg.content.replace('[ERROR]: ', '')}
                          </div>
                        </div>
                      )
                    })
                  )}
                  {chatLoading && (
                    <div className="flex gap-4">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                        <span className="animate-pulse">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
               </div>
               
               <form onSubmit={handleSendMessage} className="shrink-0 mt-4 relative">
                 <Input 
                   value={chatInput}
                   onChange={e => setChatInput(e.target.value)}
                   placeholder="Ask for YouTube tutorials, skills to learn, or interview tips..."
                   className="w-full h-14 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full pl-6 pr-14 focus-visible:ring-primary shadow-sm"
                   disabled={chatLoading}
                 />
                 <Button 
                   type="submit" 
                   size="icon" 
                   disabled={!chatInput.trim() || chatLoading}
                   className="absolute right-2 top-2 h-10 w-10 rounded-full"
                 >
                   <Send className="h-4 w-4" />
                 </Button>
               </form>
            </TabsContent>

            {kit && (
              <>
                <TabsContent value="cover-letter" className="mt-8 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Generated Cover Letter</h4>
                    <div className="text-sm whitespace-pre-wrap leading-loose font-medium">
                      {kit.cover_letter}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resume-bullets" className="mt-8 space-y-4">
                  <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Optimized Resume Bullets</h4>
                    <ul className="space-y-4">
                      {kit.resume_bullets?.map((bullet, i) => (
                        <li key={i} className="flex gap-4 items-start group">
                          <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 group-hover:scale-150 transition-transform" />
                          <p className="text-sm font-medium leading-relaxed">{bullet}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="interview" className="mt-8 space-y-4">
                  <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Predicted Interview Questions</h4>
                    <ol className="space-y-6">
                      {kit.interview_questions?.map((q, i) => (
                        <li key={i} className="space-y-2">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Question {i + 1}</span>
                          <p className="text-sm font-bold leading-relaxed">{q}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </TabsContent>

                <TabsContent value="brief" className="mt-8 space-y-4">
                  <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Target Organization Brief</h4>
                    <div className="text-sm whitespace-pre-wrap leading-loose font-medium">
                      {kit.company_brief}
                    </div>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
