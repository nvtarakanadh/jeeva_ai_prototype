# 🆓 Free AI Setup with Ollama

## What is Ollama?
Ollama is a free, local AI service that runs on your computer. It's completely private and costs nothing!

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Ollama
1. Go to https://ollama.ai/download
2. Download and install Ollama for your operating system
3. Run the installer

### Step 2: Install a Model
Open your terminal/command prompt and run:
```bash
# Install Llama 2 (recommended for health analysis)
ollama pull llama2

# Or install Llama 3 (newer, better performance)
ollama pull llama3
```

### Step 3: Start Ollama
```bash
# Start the Ollama service
ollama serve
```

### Step 4: Test Ollama
```bash
# Test if it's working
ollama run llama2 "Hello, test message"
```

## 🔧 Configuration

### Environment Variables (Optional)
You can set these in your Supabase project settings:

- `OLLAMA_URL`: `http://localhost:11434` (default)
- `OLLAMA_MODEL`: `llama2` (default)

### Available Models
- `llama2` - Good for general analysis
- `llama3` - Better performance, newer
- `codellama` - Good for technical content
- `mistral` - Fast and efficient

## 🏥 Health Analysis Features

The AI will analyze health records and provide:
- ✅ Summary of the record
- ✅ Key findings
- ✅ Risk warnings
- ✅ Recommendations
- ✅ Confidence score

## 🔒 Privacy Benefits

- ✅ **100% Local**: Data never leaves your computer
- ✅ **No API Keys**: No external services needed
- ✅ **Free Forever**: No usage limits or costs
- ✅ **Offline Capable**: Works without internet

## 🚨 Troubleshooting

### Ollama not starting?
```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve
```

### Model not found?
```bash
# List available models
ollama list

# Pull a model
ollama pull llama2
```

### Port already in use?
```bash
# Kill any process using port 11434
# Windows:
netstat -ano | findstr :11434
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:11434 | xargs kill -9
```

## 🎯 Next Steps

1. Install Ollama
2. Pull a model (llama2 or llama3)
3. Start Ollama service
4. Deploy your updated Edge Function
5. Test the AI analytics!

Your health analytics will now be powered by free, local AI! 🎉
