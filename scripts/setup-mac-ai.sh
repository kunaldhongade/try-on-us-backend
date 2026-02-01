#!/bin/bash

# setup-mac-ai.sh
# This script sets up the EXACT IDM-VTON model natively on macOS with Apple Silicon (MPS).

echo "🚀 Starting Native Mac AI Setup (IDM-VTON)..."

# 1. Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Please install it first: https://brew.sh/"
    exit 1
fi

# 2. Install Python 3.10
echo "📦 Installing Python 3.10..."
brew install python@3.10

# 3. Create Virtual Environment
echo "venv Creating virtual environment..."
/opt/homebrew/opt/python@3.10/bin/python3 -m venv venv-ai
source venv-ai/bin/activate

# 4. Install PyTorch with MPS
echo "🔥 Installing PyTorch with Apple Silicon (MPS) support..."
pip install --upgrade pip
pip install torch torchvision torchaudio

# 5. Clone the EXACT IDM-VTON repository
echo "📥 Cloning IDM-VTON..."
git clone https://github.com/yisol/IDM-VTON.git
cd IDM-VTON

# 6. Install Dependencies
echo "🛠️ Installing dependencies..."
pip install -r requirements.txt
pip install diffusers transformers accelerate gradio

echo ""
echo "✅ Setup Complete!"
echo "To run the model runner:"
echo "1. source ../venv-ai/bin/activate"
echo "2. python app.py"
echo ""
echo "Backend in Docker will automatically connect to: http://host.docker.internal:7860"
