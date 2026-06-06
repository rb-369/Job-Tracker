import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function callOpenRouterFallback(prompt: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured for fallback.');
  }
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "moonshotai/kimi-k2.6:free",
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(req: Request) {
  const supabase = await createClient();

  try {
    const { jobId, description } = await req.json();

    // 1. Fetch User Resume
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('resume_text')
      .single();

    const resumeText = profile?.resume_text || "No resume provided.";

    const prompt = `
      You are an expert career coach. Based on the following User Resume and Job Description, generate a job application kit.
      
      User Resume:
      ${resumeText}
      
      Job Description:
      ${description}
      
      Return the output strictly in the following JSON format without any other text or markdown block markers:
      {
        "cover_letter": "...",
        "resume_bullets": ["bullet 1", "bullet 2", "bullet 3"],
        "interview_questions": ["question 1", "question 2", "question 3", "question 4", "question 5"],
        "company_brief": "..."
      }
      
      The cover letter should be professional and tailored.
      The resume bullets should be re-written to highlight relevant skills from the resume for this specific job.
      The interview questions should be a mix of technical and behavioral.
      The company brief should summarize the company's mission and what they do based on the context.
    `;

    let text = "";
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error("No Gemini Key");
      // 2. Initialize Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (geminiError: any) {
      console.error('Gemini Generation Error:', geminiError);
      // Fallback to OpenRouter
      console.log("Attempting OpenRouter Fallback...");
      try {
        text = await callOpenRouterFallback(prompt);
      } catch (fallbackError: any) {
         console.error('OpenRouter Fallback Error:', fallbackError);
         return NextResponse.json(
           { error: 'High Demand or Rate Limits Exceeded on AI providers. Please try again later.' },
           { status: 503 }
         );
      }
    }
    
    // Clean up the response if it includes markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    
    const kit = JSON.parse(jsonString);

    if (jobId) {
      await supabase.from('jobs').update({ intel_kit: kit }).eq('id', jobId);
    }

    return NextResponse.json(kit);
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate kit due to unexpected output format or server error.' }, { status: 500 });
  }
}
