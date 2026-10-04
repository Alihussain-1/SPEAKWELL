'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Sliders,
  History,
  Volume2,
  Play,
  Pause,
  Download,
  RotateCcw,
  Loader2,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { VoiceOption, HistoryItem, EmotionOption } from '@/types/tts';
import VoiceModal from '@/components/VoiceModal';
import CustomDropdown, { EMOTIONS } from '@/components/CustomDropdown';
import HistoryList from '@/components/HistoryList';
import { getStoredHistory, saveHistorySafely } from '@/lib/storage';

const SAMPLE_SCRIPTS = [
  {
    label: 'Welcome',
    text: 'Welcome to SpeakWell! Fast, studio-grade text-to-speech powered directly by Microsoft Edge neural voices. Experience effortless natural synthesis with zero serverless latency.',
  },
  {
    label: 'Product Demo',
    text: 'Introducing our newest feature release: instant voice generation, full pitch modulation, and lightweight local storage synchronization for all your voiceover workflows.',
  },
  {
    label: 'Storytelling',
    text: 'The evening mist slowly drifted across the quiet harbor. High above on the cliff, the lighthouse beam pierced through the darkness, guiding travelers safely home.',
  },
];

export default function TTSForm() {
  // Script editor state
  const [text, setText] = useState<string>(SAMPLE_SCRIPTS[0].text);
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');

  // Voices state
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState<boolean>(true);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Settings state
  const [emotion, setEmotion] = useState<string>('neutral');
  const [speed, setSpeed] = useState<number>(1.0); // 0.5x to 2.0x
  const [pitch, setPitch] = useState<number>(0); // -50Hz to +50Hz

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingInfo, setGeneratingInfo] = useState<{
    text: string;
    voiceDisplayName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Current generated audio player state
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentSrtContent, setCurrentSrtContent] = useState<string | null>(null);
  const [isPlayingCurrent, setIsPlayingCurrent] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load voices from API on mount
  useEffect(() => {
    async function fetchVoices() {
      try {
        setIsLoadingVoices(true);
        const res = await fetch('/api/tts');
        const data = await res.json();
        if (data.success && Array.isArray(data.voices)) {
          setVoices(data.voices);
          // Default to US Jenny or the first voice
          const defaultVoice =
            data.voices.find((v: VoiceOption) => v.id === 'en-US-JennyNeural') ||
            data.voices[0];
          setSelectedVoice(defaultVoice || null);
        }
      } catch (err) {
        console.error('Failed to load voices:', err);
      } finally {
        setIsLoadingVoices(false);
      }
    }

    fetchVoices();
  }, []);

  // Load history from localStorage on mount
  useEffect(() => {
    const loaded = getStoredHistory();
    setHistory(loaded);
  }, []);

  // Sync audio player events
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setAudioCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setAudioDuration(audio.duration || 0);
    const onEnded = () => setIsPlayingCurrent(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentAudioUrl]);

  // Handle Emotion Preset Change
  const handleEmotionChange = (chosenEmotion: EmotionOption) => {
    setEmotion(chosenEmotion.id);
    if (chosenEmotion.rateOffset !== undefined && chosenEmotion.rateOffset !== 0) {
      setSpeed(chosenEmotion.rateOffset);
    } else {
      setSpeed(1.0);
    }

    if (chosenEmotion.pitchOffset !== undefined) {
      setPitch(chosenEmotion.pitchOffset);
    } else {
      setPitch(0);
    }
  };

  // Convert speed (0.5 - 2.0) to rate string (e.g., "+20%", "-10%")
  const formatRateParam = (val: number): string => {
    const percent = Math.round((val - 1) * 100);
    return percent >= 0 ? `+${percent}%` : `${percent}%`;
  };

  // Convert pitch (-50 - +50) to pitch string (e.g., "+10Hz", "-5Hz")
  const formatPitchParam = (val: number): string => {
    return val >= 0 ? `+${val}Hz` : `${val}Hz`;
  };

  // Generate Speech Handler: switches to History tab and displays generating bar
  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter some text to generate speech.');
      return;
    }

    if (!selectedVoice) {
      setErrorMessage('Please select a voice before generating.');
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratingInfo({
        text: text.trim(),
        voiceDisplayName: selectedVoice.displayName,
      });
      setErrorMessage(null);

      // Lead the user directly to History tab as requested
      setActiveTab('history');

      const rateParam = formatRateParam(speed);
      const pitchParam = formatPitchParam(pitch);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice.name,
          rate: rateParam,
          pitch: pitchParam,
          emotion,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.audioUrl) {
        throw new Error(data.error || 'Failed to synthesize audio');
      }

      // Store current audio & SRT
      setCurrentAudioUrl(data.audioUrl);
      setCurrentSrtContent(data.srtContent || null);
      setIsPlayingCurrent(true);

      // Create new history item with SRT subtitles
      const newItem: HistoryItem = {
        id: `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: text.trim(),
        voice: selectedVoice.name,
        voiceDisplayName: selectedVoice.displayName,
        audioUrl: data.audioUrl,
        srtContent: data.srtContent || undefined,
        createdAt: new Date().toISOString(),
        rate: rateParam,
        pitch: pitchParam,
        emotion,
      };

      const updatedHistory = [newItem, ...history];
      const savedHistory = saveHistorySafely(updatedHistory);
      setHistory(savedHistory);

      // Automatically play synthesized audio
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = data.audioUrl;
        audioPlayerRef.current.play().catch((err) => {
          console.warn('Auto-play prevented by browser policy:', err);
          setIsPlayingCurrent(false);
        });
      }
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setErrorMessage(err.message || 'An error occurred during audio generation.');
    } finally {
      setIsGenerating(false);
      setGeneratingInfo(null);
    }
  };

  // Toggle current audio playback
  const togglePlayCurrent = () => {
    if (!audioPlayerRef.current || !currentAudioUrl) return;

    if (isPlayingCurrent) {
      audioPlayerRef.current.pause();
      setIsPlayingCurrent(false);
    } else {
      audioPlayerRef.current
        .play()
        .then(() => {
          setIsPlayingCurrent(true);
        })
        .catch((e) => console.error(e));
    }
  };

  // Seek current audio
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setAudioCurrentTime(time);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = time;
    }
  };

  // Download Current Audio
  const handleDownloadCurrentMp3 = () => {
    if (!currentAudioUrl) return;
    const link = document.createElement('a');
    link.href = currentAudioUrl;
    link.download = `speakwell_speech_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Current SRT
  const handleDownloadCurrentSrt = () => {
    if (!currentSrtContent) return;
    const blob = new Blob([currentSrtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `speakwell_subtitles_${Date.now()}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // History Actions
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    const saved = saveHistorySafely(updated);
    setHistory(saved);
  };

  const handleClearAllHistory = () => {
    if (confirm('Are you sure you want to clear your speech history?')) {
      saveHistorySafely([]);
      setHistory([]);
    }
  };

  // Format time (seconds to MM:SS)
  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Hidden native audio element for player */}
      <audio ref={audioPlayerRef} preload="metadata" />

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT PANEL: SCRIPT EDITOR ================= */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] shadow-sm overflow-hidden transition-colors">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#181818]/60">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Script Editor
              </span>
            </div>

            {/* Quick sample prompt chips */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="text-[11px] text-neutral-400 mr-1">Samples:</span>
              {SAMPLE_SCRIPTS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setText(s.text)}
                  className="px-2 py-0.5 rounded text-[11px] font-medium border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-[#222222] text-neutral-600 dark:text-neutral-300 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea Area */}
          <div className="p-5 flex-1 flex flex-col min-h-[340px]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your script here to convert to natural human speech..."
              rows={12}
              className="w-full flex-1 resize-y bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none text-base leading-relaxed selection:bg-neutral-200 dark:selection:bg-neutral-800 border-0 p-0"
            />
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mx-5 mb-4 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Synthesized Audio Player Bar */}
          {currentAudioUrl && (
            <div className="mx-5 mb-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#181818] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Generated Audio Clip
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadCurrentMp3}
                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>MP3</span>
                  </button>

                  {currentSrtContent && (
                    <button
                      type="button"
                      onClick={handleDownloadCurrentSrt}
                      title="Download Subtitles with Timestamps (.srt)"
                      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-neutral-500" />
                      <span>.SRT</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayCurrent}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity shrink-0 shadow"
                >
                  {isPlayingCurrent ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="range"
                    min={0}
                    max={audioDuration || 100}
                    step={0.1}
                    value={audioCurrentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>{formatSeconds(audioCurrentTime)}</span>
                    <span>{formatSeconds(audioDuration)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#181818]/40 flex items-center justify-between">
            {/* Character & Word Count */}
            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              <span>{text.length} chars</span>
              <span>•</span>
              <span>
                {text.trim() ? text.trim().split(/\s+/).length : 0} words
              </span>
            </div>

            {/* Clear & Generate Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setText('')}
                disabled={!text || isGenerating}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#202020] transition-colors disabled:opacity-40"
                title="Clear text"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-neutral-900 hover:bg-black dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Speech</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL: TABS (SETTINGS & HISTORY) ================= */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] shadow-sm overflow-hidden transition-colors">
          {/* Tabs Navigation */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#181818]/60 p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-[#222222] text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors relative ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-[#222222] text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {history.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-5 flex-1 min-h-[480px]">
            {activeTab === 'settings' ? (
              <div className="space-y-6">
                {/* 1. Voice Selector Button */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                    Voice Actor
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#181818] hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-[#202020] text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedVoice
                          ? selectedVoice.displayName.slice(0, 2).toUpperCase()
                          : 'US'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {selectedVoice ? selectedVoice.displayName : 'Select a voice'}
                          </span>
                          {selectedVoice && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                              {selectedVoice.gender}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {selectedVoice
                            ? `${selectedVoice.language} (${selectedVoice.country})`
                            : 'Choose from 300+ Edge TTS neural voices'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                </div>

                {/* 2. Emotion Dropdown */}
                <CustomDropdown
                  value={emotion}
                  onChange={handleEmotionChange}
                />

                {/* 3. Speed Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Speaking Speed
                    </label>
                    <span className="text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-[#202020] px-2 py-0.5 rounded">
                      {speed.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>0.5x</span>
                    <button
                      type="button"
                      onClick={() => setSpeed(1.0)}
                      className="hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      Default (1.0x)
                    </button>
                    <span>2.0x</span>
                  </div>
                </div>

                {/* 4. Pitch Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Voice Pitch
                    </label>
                    <span className="text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-[#202020] px-2 py-0.5 rounded">
                      {pitch > 0 ? `+${pitch}Hz` : `${pitch}Hz`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={pitch}
                    onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>-50Hz</span>
                    <button
                      type="button"
                      onClick={() => setPitch(0)}
                      className="hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      Default (0Hz)
                    </button>
                    <span>+50Hz</span>
                  </div>
                </div>

                {/* Subtitle feature info card */}
                <div className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#181818]/50 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Synchronized .SRT Subtitles</span>
                  </div>
                  <p>
                    Every generation extracts real word boundary timestamps and builds downloadable .srt subtitle files alongside MP3 audio.
                  </p>
                </div>
              </div>
            ) : (
              /* History Tab with generating indicator */
              <HistoryList
                history={history}
                isGenerating={isGenerating}
                generatingInfo={generatingInfo}
                onDelete={handleDeleteHistoryItem}
                onClearAll={handleClearAllHistory}
              />
            )}
          </div>
        </div>
      </div>

      {/* Voice Selection Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={(voice) => setSelectedVoice(voice)}
        voices={voices}
        isLoadingVoices={isLoadingVoices}
      />
    </div>
  );
}
