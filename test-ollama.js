// Test script for Ollama AI service
const OLLAMA_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama2';

async function testOllama() {
  console.log('🧪 Testing Ollama AI service...');
  
  try {
    // Test 1: Check if Ollama is running
    console.log('\n1. Checking if Ollama is running...');
    const healthResponse = await fetch(`${OLLAMA_URL}/api/tags`);
    
    if (!healthResponse.ok) {
      console.error('❌ Ollama is not running. Please start it with: ollama serve');
      return;
    }
    
    const models = await healthResponse.json();
    console.log('✅ Ollama is running');
    console.log('📋 Available models:', models.models?.map(m => m.name) || 'None');
    
    // Test 2: Test AI generation
    console.log('\n2. Testing AI generation...');
    const testResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: "Analyze this health record: Patient has a fever of 101°F and cough. Provide a brief analysis in JSON format with summary, key_findings, and recommendations.",
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 500
        }
      })
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('❌ AI generation failed:', errorText);
      return;
    }
    
    const result = await testResponse.json();
    console.log('✅ AI generation successful');
    console.log('🤖 AI Response:', result.response);
    
    // Test 3: Test health analysis format
    console.log('\n3. Testing health analysis format...');
    const healthTestResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `Analyze this health record and provide insights in JSON format:

Record Type: Blood Test
Title: Complete Blood Count
Description: Patient shows elevated white blood cell count
Service Date: 2024-01-15
Provider: Dr. Smith

Please provide your analysis in exactly this JSON structure:
{
  "summary": "A concise summary of the record",
  "key_findings": ["Key finding 1", "Key finding 2"],
  "risk_warnings": ["Warning 1 if applicable"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "confidence_score": 85
}

Guidelines:
- Be professional and medically accurate
- Focus on actionable insights
- Include confidence score (0-100)
- Always recommend consulting healthcare providers
- This is for educational purposes only`,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 1000
        }
      })
    });
    
    if (!healthTestResponse.ok) {
      const errorText = await healthTestResponse.text();
      console.error('❌ Health analysis test failed:', errorText);
      return;
    }
    
    const healthResult = await healthTestResponse.json();
    console.log('✅ Health analysis test successful');
    console.log('🏥 Health Analysis:', healthResult.response);
    
    console.log('\n🎉 All tests passed! Ollama is ready for health analytics.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Ollama is installed: https://ollama.ai/download');
    console.log('2. Start Ollama: ollama serve');
    console.log('3. Install a model: ollama pull llama2');
  }
}

// Run the test
testOllama();
