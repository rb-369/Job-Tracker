'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Job, JobStatus } from '@/types';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Use JSON.stringify to force the error object to show its properties in the console
        console.error('SUPABASE_DIAGNOSTIC_ERROR:', JSON.stringify(error, null, 2));
        throw error;
      }
      setJobs(data || []);
    } catch (err: any) {
      console.error('FETCH_EXCEPTION:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addJob = async (job: Omit<Job, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([job])
        .select();

      if (error) {
        console.error('ADD_JOB_ERROR:', JSON.stringify(error, null, 2));
        throw error;
      }
      if (data) setJobs(prev => [data[0], ...prev]);
      return data?.[0];
    } catch (err: any) {
      console.error('Add job failed:', err?.message || err);
    }
  };

  const updateJobStatus = async (id: string, status: JobStatus) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('UPDATE_STATUS_ERROR:', JSON.stringify(error, null, 2));
        throw error;
      }
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
    } catch (err: any) {
      console.error('Update status failed:', err?.message || err);
    }
  };

  const deleteJob = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('DELETE_JOB_ERROR:', JSON.stringify(error, null, 2));
        throw error;
      }
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err: any) {
      console.error('Delete job failed:', err?.message || err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, setJobs, loading, fetchJobs, addJob, updateJobStatus, deleteJob };
}
