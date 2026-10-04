'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Trash2,
  Clock,
  Volume2,
  Sparkles,
  FileText,
  Loader2,
} from 'lucide-react';
import { HistoryItem } from '@/types/tts';

interface HistoryListProps {
  history: HistoryItem[];
  isGenerating?: boolean;
  generatingInfo?: {
    text: string;
    voiceDisplayName: string;
  } | null;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function HistoryList({
  history,
  isGenerating = false,
  generatingInfo = null,
  onDelete,
  onClearAll,
}: HistoryListProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayToggle = (item: HistoryItem) => {
    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(item.audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setPlayingId(null);
    };

    audio.onerror = () => {
      setPlayingId(null);
    };

    audio
      .play()
      .then(() => {
        setPlayingId(item.id);
      })
      .catch((err) => {
        console.error('Audio playback failed:', err);
        setPlayingId(null);
      });
  };

  const handleDownloadMp3 = (item: HistoryItem) => {
    const link = document.createElement('a');
    link.href = item.audioUrl;
    const cleanPrefix = item.text
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    link.download = `speakwell_${cleanPrefix || 'audio'}_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSrt = (item: HistoryItem) => {
    if (!item.srtContent) {
      alert('No subtitle timestamps found for this generation.');
      return;
    }
    const blob = new Blob([item.srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanPrefix = item.text
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    link.download = `speakwell_${cleanPrefix || 'subtitles'}_${Date.now()}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with counts and clear button */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {history.length} Saved Generation{history.length !== 1 ? 's' : ''}
        </span>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
        {/* ================= ACTIVE GENERATION PROGRESS CARD ================= */}
        {isGenerating && generatingInfo && (
          <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1c1c1c] shadow-md animate-fadeIn space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-900 dark:text-white" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Synthesizing Speech...
                </span>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {generatingInfo.voiceDisplayName}
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 italic">
              "{generatingInfo.text}"
            </p>

            {/* Animated Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                <div className="h-full bg-neutral-900 dark:bg-white rounded-full w-2/3 animate-pulse" />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>In-memory Edge TTS streaming</span>
                <span>Calculating SRT timestamps...</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no history and not generating */}
        {history.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#1f1f1f] flex items-center justify-center text-neutral-400 mb-3">
              <Clock className="w-6 h-6 stroke-1" />
            </div>
            <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              No Audio Generations Yet
            </h4>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs">
              When you generate speech, your clips will appear here with inline playback, MP3 download, and synchronized .SRT subtitle exports.
            </p>
          </div>
        )}

        {/* Saved History Items */}
        {history.map((item) => {
          const isPlaying = playingId === item.id;

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#181818] hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col gap-2.5"
            >
              {/* Text content preview */}
              <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium line-clamp-2 leading-relaxed">
                "{item.text}"
              </p>

              {/* Meta information tags */}
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300">
                    <Volume2 className="w-3 h-3 text-neutral-400" />
                    {item.voiceDisplayName || item.voice}
                  </span>

                  {item.emotion && item.emotion !== 'neutral' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-[#222222] text-neutral-600 dark:text-neutral-300 font-medium capitalize">
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                      {item.emotion}
                    </span>
                  )}

                  {item.rate && item.rate !== '+0%' && item.rate !== '0%' && (
                    <span className="text-[10px] text-neutral-400">
                      Rate {item.rate}
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-neutral-400 shrink-0">
                  {formatDate(item.createdAt)}
                </span>
              </div>

              {/* Action Buttons: Play, Download MP3, Download SRT, Delete */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                {/* Inline Play/Pause Toggle */}
                <button
                  type="button"
                  onClick={() => handlePlayToggle(item)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isPlaying
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-[#202020] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-[#282828]'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>Play Clip</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  {/* Download MP3 */}
                  <button
                    type="button"
                    onClick={() => handleDownloadMp3(item)}
                    title="Download MP3 Audio"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#222222] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>MP3</span>
                  </button>

                  {/* Download .SRT Subtitles */}
                  {item.srtContent && (
                    <button
                      type="button"
                      onClick={() => handleDownloadSrt(item)}
                      title="Download .SRT Subtitles with Timestamps"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#222222] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-neutral-500" />
                      <span>.SRT</span>
                    </button>
                  )}

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    title="Delete clip"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
