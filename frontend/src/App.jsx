import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Play, Loader2, Settings2, Volume2, ChevronLeft, ChevronRight, X, Download, BookOpen } from 'lucide-react';

const ACCENTS = ['Australian', 'British', 'American', 'Irish', 'Scottish', 'South African'];
const MOODS = ['Neutral', 'Joyful', 'Suspenseful', 'Somber', 'Energetic', 'Romantic', 'Mysterious'];
const VOICES = [
  { label: '♀ Kore (Female)', value: 'Kore' },
  { label: '♀ Aoede (Female)', value: 'Aoede' },
  { label: '♀ Leda (Female)', value: 'Leda' },
  { label: '♂ Puck (Male)', value: 'Puck' },
  { label: '♂ Charon (Male)', value: 'Charon' },
  { label: '♂ Orus (Male)', value: 'Orus' },
];

function App() {
  const [file, setFile] = useState(null);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [mood, setMood] = useState(MOODS[0]);
  const [voice, setVoice] = useState(VOICES[0].value);
  
  const [pages, setPages] = useState([]);
  const [audioCache, setAudioCache] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [pageJumpInput, setPageJumpInput] = useState('');
  
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        const ext = selectedFile.name.toLowerCase();
        if (ext.endsWith(".txt") || ext.endsWith(".pdf") || ext.endsWith(".epub")) {
            setFile(selectedFile);
            setError(null);
            await parseBook(selectedFile);
        } else {
            setError("Please upload a valid .txt, .pdf, or .epub file");
            setFile(null);
        }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseBook = async (uploadedFile) => {
    setIsParsing(true);
    setError(null);
    setPages([]);
    setCurrentPage(0);
    setAudioUrl(null);
    setAudioCache({});

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await fetch("http://localhost:8000/parse-book", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to parse book");
      }

      const data = await response.json();
      setPages(data.pages);
    } catch (err) {
      setError(err.message);
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const generatePageAudio = async () => {
    if (pages.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch("http://localhost:8000/generate-page-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pages[currentPage],
          emotion: mood,
          accent: accent,
          voice: voice
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
      setAudioCache(prev => ({
          ...prev,
          [currentPage]: audioUri
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const changePage = (offset) => {
    const newPage = currentPage + offset;
    if (newPage >= 0 && newPage < pages.length) {
      setCurrentPage(newPage);
      if (audioCache[newPage]) {
          setAudioUrl(audioCache[newPage]);
      } else {
          setAudioUrl(null);
      }
    }
  };

  const jumpToPage = () => {
    const target = parseInt(pageJumpInput, 10) - 1;
    if (!isNaN(target) && target >= 0 && target < pages.length) {
      setCurrentPage(target);
      if (audioCache[target]) {
        setAudioUrl(audioCache[target]);
      } else {
        setAudioUrl(null);
      }
      setPageJumpInput('');
    }
  };

  const closeReader = () => {
    setPages([]);
    setFile(null);
    setAudioUrl(null);
    setError(null);
    setAudioCache({});
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-rose-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-4000"></div>

      <main className="w-full max-w-4xl relative z-10 space-y-8 flex flex-col items-center">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl mb-4 border border-secondary/30 shadow-sm">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-textMain drop-shadow-sm">
            Book Narrator
          </h1>
          <p className="text-lg text-textMuted max-w-2xl mx-auto">
            Transform entire books into breathtaking, expressive audio experiences — page by page ✨
          </p>
        </div>

        {/* Global Settings Ribbon */}
        <div className="glass-panel w-full rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-center items-center flex-wrap relative z-20">
          <div className="flex items-center gap-2">
             <Settings2 className="w-5 h-5 text-primary" />
             <span className="font-semibold px-1 text-sm">Voice Settings</span>
          </div>
          <select 
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="bg-white border border-primary/20 rounded-xl px-3 py-2 text-sm text-textMain focus:ring-2 focus:ring-primary outline-none"
          >
            {VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <select 
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="bg-white border border-primary/20 rounded-xl px-3 py-2 text-sm text-textMain focus:ring-2 focus:ring-primary outline-none"
          >
            {ACCENTS.map(a => <option key={a} value={a}>{a} Accent</option>)}
          </select>
          <select 
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="bg-white border border-primary/20 rounded-xl px-3 py-2 text-sm text-textMain focus:ring-2 focus:ring-secondary outline-none"
          >
            {MOODS.map(m => <option key={m} value={m}>{m} Mood</option>)}
          </select>
        </div>

        {/* Main Interface */}
        <div className="glass-panel w-full rounded-3xl p-8 sm:p-12">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center mb-6">
              {error}
            </div>
          )}

          {/* Upload View (When no book is loaded) */}
          {pages.length === 0 && (
             <div className="space-y-6">
               <div 
                  onClick={() => !isParsing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors bg-pink-50/50 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer text-center group ${isParsing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".txt,.pdf,.epub" 
                    className="hidden" 
                    disabled={isParsing}
                  />
                  
                  {isParsing ? (
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="w-16 h-16 animate-spin text-primary" />
                      <p className="font-medium text-lg">Parsing Book Chapters...</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-16 h-16 text-primary/50 group-hover:text-primary transition-colors mb-4" />
                      <p className="font-medium text-xl text-textMain mb-2">Upload a .txt, .pdf, or .epub book</p>
                      <p className="text-sm text-textMuted">We'll automatically split it into pages and stream audio like magic 🎵</p>
                    </>
                  )}
                </div>
             </div>
          )}

          {/* Reader View (When book is loaded) */}
          {pages.length > 0 && (
             <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-semibold truncate max-w-[200px] md:max-w-xs">{file?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-textMuted bg-pink-50 px-3 py-1 rounded-full border border-primary/10">
                      Page {currentPage + 1} of {pages.length}
                    </span>
                    <button onClick={closeReader} className="text-textMuted hover:text-red-400 transition-colors" title="Close Book">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Jump to page */}
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-sm text-textMuted">Jump to page:</span>
                  <input
                    type="number"
                    min="1"
                    max={pages.length}
                    value={pageJumpInput}
                    onChange={(e) => setPageJumpInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && jumpToPage()}
                    placeholder={`1 – ${pages.length}`}
                    className="w-28 bg-white border border-primary/20 rounded-xl px-3 py-1.5 text-sm text-textMain focus:ring-2 focus:ring-primary outline-none text-center"
                  />
                  <button
                    onClick={jumpToPage}
                    className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-xl transition-colors"
                  >
                    Go
                  </button>
                </div>

                {/* Text View */}
                <div className="bg-white/80 rounded-2xl p-8 h-[40vh] overflow-y-auto text-textMain leading-loose font-serif text-lg custom-scrollbar border border-primary/10 shadow-inner">
                   {pages[currentPage].split('\n').map((para, i) => (
                      <p key={i} className="mb-4">{para}</p>
                   ))}
                </div>

                {/* Playback & Paging Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-2">
                   <div className="flex gap-2">
                     <button 
                       onClick={() => changePage(-1)}
                       disabled={currentPage === 0 || isGenerating}
                       className="p-3 bg-white hover:bg-gray-50 border border-primary/20 rounded-full disabled:opacity-40 transition-all shadow-sm"
                     >
                       <ChevronLeft className="w-6 h-6 text-primary" />
                     </button>
                     <button 
                       onClick={() => changePage(1)}
                       disabled={currentPage === pages.length - 1 || isGenerating}
                       className="p-3 bg-white hover:bg-gray-50 border border-primary/20 rounded-full disabled:opacity-40 transition-all shadow-sm"
                     >
                       <ChevronRight className="w-6 h-6 text-primary" />
                     </button>
                   </div>

                   {/* Audio Player Core */}
                   <div className="flex-1 w-full flex justify-center">
                     {audioUrl ? (
                         <div className="flex flex-col items-center gap-2 w-full">
                           <div className="bg-white rounded-full py-2 px-4 shadow-md w-full max-w-md border border-primary/10">
                             <audio 
                              controls 
                              autoPlay
                              src={audioUrl} 
                              className="w-full h-10 outline-none"
                              onEnded={() => {
                                 if(currentPage < pages.length - 1) {
                                     // Optional auto-play next page logic
                                 }
                              }}
                             />
                           </div>
                           <div className="flex gap-6 items-center">
                             <button 
                               onClick={generatePageAudio} 
                               disabled={isGenerating} 
                               className="text-xs text-textMuted hover:text-primary transition-colors flex items-center gap-1"
                             >
                               {isGenerating ? "Recording..." : "Regenerate Voice"}
                             </button>
                             <a
                               href={audioUrl}
                               download={`Page_${currentPage + 1}_Audio.wav`}
                               className="text-xs text-textMuted hover:text-secondary transition-colors flex items-center gap-1"
                             >
                               <Download className="w-3 h-3" /> Download Audio
                             </a>
                           </div>
                        </div>
                     ) : (
                        <button
                          onClick={generatePageAudio}
                          disabled={isGenerating}
                          className={`relative px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-all duration-300 w-full md:w-auto justify-center ${
                            isGenerating
                              ? 'bg-gray-100 text-textMuted cursor-not-allowed opacity-80 border-2 border-gray-200' 
                              : 'bg-primary text-white hover:bg-opacity-90 hover:-translate-y-1 shadow-md hover:shadow-lg'
                          }`}
                        >
                          {isGenerating ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Recording Page...</>
                          ) : (
                            <><Play className="w-5 h-5 fill-current" /> Play Page Chapter</>
                          )}
                        </button>
                     )}
                   </div>
                </div>

             </div>
          )}
          
        </div>
      </main>
    </div>
  );
}

export default App;
