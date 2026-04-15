import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Play, Loader2, Settings2, Sparkles, Volume2 } from 'lucide-react';

const ACCENTS = ['Australian', 'British', 'American', 'Irish', 'Scottish', 'South African'];
const MOODS = ['Neutral', 'Joyful', 'Suspenseful', 'Somber', 'Energetic', 'Romantic', 'Mysterious'];

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [mood, setMood] = useState(MOODS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/plain") {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (ev) => setText(ev.target.result);
      reader.readAsText(selectedFile);
    } else {
      setError("Please upload a valid .txt file");
    }
  };

  const handleGenerate = async () => {
    if (!text) {
      setError("Please upload a text file first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch("http://localhost:8000/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          emotion: mood,
          accent: accent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate audio");
      }

      const data = await response.json();
      const audioBytes = data.audio_base64;
      const audioUri = `data:${data.mime_type};base64,${audioBytes}`;
      setAudioUrl(audioUri);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <main className="w-full max-w-4xl relative z-10 space-y-8 flex flex-col items-center">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-4">
            <Volume2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-secondary">
            Sonic Narrator
          </h1>
          <p className="text-lg text-textMuted max-w-2xl mx-auto">
            Transform plain text into breathtaking, expressive audio experiences powered by the Gemini AI.
          </p>
        </div>

        {/* Main Content Box */}
        <div className="glass-panel w-full rounded-3xl p-8 sm:p-12 space-y-10">
          
          {/* Top Section: Upload & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left: File Upload */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Script Source
              </h2>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors bg-white/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer text-center group h-48"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".txt" 
                  className="hidden" 
                />
                <UploadCloud className="w-12 h-12 text-textMuted group-hover:text-primary transition-colors mb-4" />
                {file ? (
                  <div className="space-y-1">
                    <p className="font-medium text-textMain truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-textMuted">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-medium text-textMain">Choose a .txt file</p>
                    <p className="text-xs text-textMuted">Drag and drop or click to browse</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Voice Settings */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-secondary" />
                Voice Persona
              </h2>
              
              <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10 h-48 flex flex-col justify-center">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textMuted">Narrator Accent</label>
                  <select 
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    {ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-textMuted">Emotional Mood</label>
                  <select 
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-textMain focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all"
                  >
                    {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Generate Button Wrapper */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !file}
              className={`relative px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 transition-all duration-300 ${
                isLoading || !file 
                  ? 'bg-surface text-textMuted cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-105'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating Masterpiece...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate Audio
                </>
              )}
            </button>
          </div>

          {/* Audio Player Section */}
          {audioUrl && (
            <div className="pt-8 border-t border-white/10 flex flex-col items-center space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <h3 className="text-lg font-medium text-textMain">Your Audio is Ready</h3>
              <div className="w-full max-w-md bg-background/50 rounded-full py-2 px-4 border border-white/5">
                 <audio 
                  controls 
                  src={audioUrl} 
                  className="w-full h-12 outline-none [&::-webkit-media-controls-panel]:bg-transparent [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white"
                />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
