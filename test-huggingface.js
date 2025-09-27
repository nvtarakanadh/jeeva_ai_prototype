// Test script for Hugging Face AI service
const SUPABASE_URL = 'https://wgcmusjsuziqjkzuaqkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4';

async function testHuggingFace() {
  console.log('🧪 Testing Hugging Face AI service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze-health-record`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check successful');
      console.log('📊 Environment status:', healthData.environment);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      const errorText = await healthResponse.text();
      console.log('Error:', errorText);
    }

    console.log('\n2. Testing AI analysis (test mode)...');
    const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze-health-record`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        testOnly: true
      })
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ AI test successful');
      console.log('📝 Response:', testData.message);
    } else {
      console.log('❌ AI test failed:', testResponse.status);
      const errorText = await testResponse.text();
      console.log('Error:', errorText);
    }

    console.log('\n3. Testing full AI analysis...');
    const analysisResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze-health-record`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Patient has high blood pressure (150/95 mmHg), elevated cholesterol levels, and reports chest pain during exercise. Blood sugar is normal. Patient is 45 years old, non-smoker, with family history of heart disease."
      })
    });

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log('✅ Full analysis successful');
      console.log('📊 Analysis result:', analysisData.analysis);
    } else {
      console.log('❌ Full analysis failed:', analysisResponse.status);
      const errorText = await analysisResponse.text();
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the Edge Function is deployed');
    console.log('2. Check that HUGGING_FACE_API_KEY is set in Supabase');
    console.log('3. Verify your Hugging Face API key is valid');
  }
}

testHuggingFace();
