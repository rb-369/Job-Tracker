import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SENDGRID_API_KEY || !RAPIDAPI_KEY) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// Use Service Role Key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
sgMail.setApiKey(SENDGRID_API_KEY);

async function fetchJobsFromAPI(query, location) {
  // Simplify the location string (take only the first part if separated by commas to avoid confusing the API)
  const primaryLocation = location.split(',')[0].trim();
  const searchString = `${query} in ${primaryLocation}`;
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchString)}&date_posted=month&num_pages=1`;
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  };

  try {
    console.log(`Calling JSearch API with query: "${searchString}"`);
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (result.message) {
       console.error("API returned a message:", result.message);
    }
    
    return result.data || [];
  } catch (error) {
    console.error("RapidAPI Fetch Error:", error);
    return [];
  }
}

async function sendEmailNotification(email, jobs, targetTitle) {
  if (jobs.length === 0) return;

  const jobListHTML = jobs.map(job => `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: #111;">${job.job_title}</h3>
      <p style="margin: 0 0 5px 0; color: #555;"><strong>Company:</strong> ${job.employer_name}</p>
      <p style="margin: 0 0 10px 0; color: #555;"><strong>Location:</strong> ${job.job_city}, ${job.job_country}</p>
      <a href="${job.job_apply_link}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">Apply Now</a>
    </div>
  `).join('');

  const msg = {
    to: email,
    from: 'hello@your-domain.com', // Must be verified in SendGrid
    subject: `Daily Pipeline Update: New ${targetTitle} Jobs`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111; border-bottom: 2px solid #000; padding-bottom: 10px;">Pipeline Alert</h2>
        <p style="color: #333; font-size: 16px;">We found ${jobs.length} new opportunities matching your profile today.</p>
        ${jobListHTML}
        <p style="color: #777; font-size: 12px; margin-top: 30px;">This is an automated alert from your Job Tracker.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
}

async function run() {
  console.log("Starting daily job fetch routine...");
  
  // 1. Fetch all user profiles that have target_job_title, location, and email set
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('email, target_job_title, location')
    .not('email', 'is', null)
    .not('target_job_title', 'is', null)
    .not('location', 'is', null);

  if (error) {
    console.error("Error fetching profiles:", error);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("No configured user profiles found. Exiting.");
    process.exit(0);
  }

  for (const profile of profiles) {
    console.log(`Processing for ${profile.email} - Target: ${profile.target_job_title} in ${profile.location}`);
    
    // 2. Fetch jobs from RapidAPI
    const jobs = await fetchJobsFromAPI(profile.target_job_title, profile.location);
    console.log(`Found ${jobs.length} jobs.`);
    
    // 3. Send email if jobs are found
    if (jobs.length > 0) {
      // Send max 5 jobs to keep email clean
      await sendEmailNotification(profile.email, jobs.slice(0, 5), profile.target_job_title);
    }
  }
  
  console.log("Routine completed.");
}

run();
