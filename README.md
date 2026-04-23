# Emotional Audiobook Reader

The Emotional Audiobook Reader is a full-stack web application that allows users to upload their favorite books (TXT, PDF, EPUB) and listen to them as audiobooks narrated by highly expressive AI voices. Powered by the Gemini API (specifically `gemini-3.1-flash-tts-preview`), this app offers unique emotional tones and accents to elevate your listening experience.

## ✨ Features

- **Document Parsing**: Supports uploading and extracting text from standard book formats (`.txt`, `.pdf`, `.epub`).
- **Expressive Narration**: Customize the narrator's emotion (e.g., Happy, Sad, Angry, Excited) and accent (e.g., British, American, Australian).
- **Voice Customization**: Built-in voice options (e.g., Kore, Aoede) directly integrated with the Gemini TTS engine.
- **Modern UI**: A responsive and elegant visual interface built with React and Tailwind CSS.
- **Audio Playback & Download**: Real-time generation, playback, and download of audio clips.

## 🛠️ Technology Stack

**Frontend**:
- UI Framework: React (Vite)
- Styling: Tailwind CSS
- Icons: Lucide React

**Backend**:
- API Framework: FastAPI & Python
- AI Integration: Google GenAI SDK (Gemini API)
- File Extraction: `pypdf`, `ebooklib`, `beautifulsoup4`

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python 3.9+
- A Google Gemini API Key

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your Gemini API Key as an environment variable:
   ```bash
   # On Windows (Command Prompt)
   set GEMINI_API_KEY=your_api_key_here
   
   # On Windows (PowerShell)
   $env:GEMINI_API_KEY="your_api_key_here"

   # On macOS/Linux
   export GEMINI_API_KEY=your_api_key_here
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend should now be running at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🎮 Usage
1. Open the frontend application in your browser (usually `http://localhost:5173`).
2. Upload a `.txt`, `.pdf`, or `.epub` file.
3. Configure your preferred narrator emotion, accent, and voice.
4. Click to convert sections into audio and enjoy your emotional audiobook!
