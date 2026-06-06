import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function callOpenRouterFallback(systemPrompt: string, history: any[], newMessage: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured for fallback.');
  }

  const formattedMessages = [];
  formattedMessages.push({ role: 'system', content: systemPrompt });

  for (const msg of history) {
    if (msg.role !== 'system') {
       formattedMessages.push({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.content });
    }
  }
  formattedMessages.push({ role: 'user', content: newMessage });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "moonshotai/kimi-k2.6:free",
      messages: formattedMessages
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('job_chats')
      .select('messages')
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) {
       console.error("Fetch chat error:", error);
       return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: data?.messages || [] });
  } catch (err: any) {
    console.error("GET Chat Error:", err);
    return NextResponse.json({ messages: [] }); // Return empty array on error to prevent UI crash
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();

  try {
    const { jobId, message } = await req.json();

    if (!jobId || !message) {
      return NextResponse.json({ error: 'jobId and message are required' }, { status: 400 });
    }

    // 1. Fetch current chat history for this job
    const { data: chatData, error: chatError } = await supabase
      .from('job_chats')
      .select('id, messages')
      .eq('job_id', jobId)
      .maybeSingle();

    const messages = chatData?.messages || [];
    const isNewChat = !chatData;
    let systemPromptContent = "";

    // 2. If new chat, fetch context and build system prompt
    if (isNewChat) {
      const { data: job } = await supabase.from('jobs').select('title, company, description').eq('id', jobId).single();
      const { data: profile } = await supabase.from('user_profiles').select('resume_text').single();

      systemPromptContent = `You are an elite career coach and technical mentor assisting a computer science diploma student with their job search and skill development.

CONTEXT:
---
Target Job Title: ${job?.title}
Target Company: ${job?.company}
Job Description:
${job?.description || 'N/A'}

Student's Current Resume:
${profile?.resume_text || 'N/A'}
---

YOUR MISSION:
1. Act as a highly intelligent, encouraging, and strategic career mentor.
2. Provide highly tailored advice strictly relevant to bridging the gap between the student's current resume and the target job's requirements.
3. If asked for learning resources (like YouTube videos or courses), provide EXACT, high-quality search terms or highly confident URLs. Specify reputable channel names (e.g., "Fireship", "Traversy Media", "Web Dev Simplified", "NeetCode").
4. Structure your responses beautifully using Markdown (bolding, bullet points) for readability.
5. Keep answers concise, actionable, and free of generic fluff. Provide immediate, practical value.`;

      messages.push({ role: 'system', content: systemPromptContent });
      // We push a dummy acknowledgement from the model so the history format is valid for Gemini (user-model alternating)
      messages.push({ role: 'model', content: 'Understood. I am ready to act as the career coach.' });
    } else {
       const sysMsg = messages.find((m: any) => m.role === 'system');
       if (sysMsg) systemPromptContent = sysMsg.content;
    }

    // Append user's new message
    messages.push({ role: 'user', content: message });

    let text = "";
    try {
      if (!process.env.CHATBOT_GEMINI_API_KEY) throw new Error("No Gemini Key");
      
      const genAI = new GoogleGenerativeAI(process.env.CHATBOT_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // 3. Format history for Gemini API
      const geminiHistory = messages.map((msg: any) => ({
        role: msg.role === 'system' ? 'user' : msg.role, // Gemini expects 'user' or 'model'
        parts: [{ text: msg.content }],
      }));

      // Start chat with history minus the last message
      const chat = model.startChat({
        history: geminiHistory.slice(0, -1),
      });

      // 4. Send the new message
      const result = await chat.sendMessage(message);
      text = result.response.text();
    } catch (geminiError: any) {
       console.error('Gemini Chat Error:', geminiError);
       console.log("Attempting OpenRouter Fallback for Chat...");
       try {
         text = await callOpenRouterFallback(systemPromptContent, messages.slice(0, -1), message);
       } catch (fallbackError: any) {
          console.error('OpenRouter Chat Fallback Error:', fallbackError);
          return NextResponse.json(
           { error: 'High Demand or Rate Limits Exceeded on AI providers. Please try again later.' },
           { status: 503 }
         );
       }
    }

    // Append AI response
    messages.push({ role: 'model', content: text });

    // 5. Upsert to Supabase
    if (isNewChat) {
      await supabase.from('job_chats').insert([{ job_id: jobId, messages }]);
    } else {
      await supabase.from('job_chats').update({ messages, updated_at: new Date().toISOString() }).eq('job_id', jobId);
    }

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process chat' }, { status: 500 });
  }
}
