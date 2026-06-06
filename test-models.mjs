import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;

if (!key) {
  console.log("No GEMINI_API_KEY found in .env.local");
  process.exit(1);
}

async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    
    if (data.error) {
      console.error("API Error:", data.error.message);
      return;
    }

    console.log("Supported Models for generateContent:");
    let found = false;
    data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
            console.log("- " + m.name.replace('models/', ''));
            found = true;
        }
    });
    
    if (!found) {
      console.log("No models support generateContent. Check your API key restrictions.");
    }
  } catch(e) {
    console.error("Fetch failed:", e);
  }
}
run();
