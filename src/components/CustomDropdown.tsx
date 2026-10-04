'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Smile, Frown, Sparkles, Heart, Briefcase, VolumeX, MessageSquare } from 'lucide-react';
import { EmotionOption } from '@/types/tts';

export const EMOTIONS: EmotionOption[] = [
  {
    id: 'neutral',
    label: 'Neutral',
    rateOffset: 0,
    pitchOffset: 0,
    description: 'Natural, balanced standard delivery',
  },
  {
    id: 'cheerful',
    label: 'Cheerful',
    rateOffset: 1.05,
    pitchOffset: 6,
    description: 'Upbeat, joyful and animated',
  },
  {
    id: 'excited',
    label: 'Excited',
    rateOffset: 1.15,
    pitchOffset: 12,
    description: 'High energy, vibrant and enthusiastic',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    rateOffset: 1.02,
    pitchOffset: 4,
    description: 'Warm, welcoming conversational tone',
  },
  {
    id: 'serious',
    label: 'Serious',
    rateOffset: 0.95,
    pitchOffset: -6,
    description: 'Formal, deliberate and authoritative',
  },
  {
    id: 'sad',
    label: 'Sad',
    rateOffset: 0.85,
    pitchOffset: -10,
    description: 'Subdued, mournful and slow paced',
  },
  {
    id: 'whisper',
    label: 'Whispery',
    rateOffset: 0.9,
    pitchOffset: -8,
    description: 'Soft, intimate and gentle tone',
  },
];

interface CustomDropdownProps {
  value: string;
  onChange: (emotion: EmotionOption) => void;
}

export default function CustomDropdown({ value, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedEmotion = EMOTIONS.find((e) => e.id === value) || EMOTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getEmotionIcon = (id: string) => {
    switch (id) {
      case 'cheerful':
        return <Smile className="w-4 h-4 text-emerald-500" />;
      case 'excited':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'friendly':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'serious':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'sad':
        return <Frown className="w-4 h-4 text-indigo-400" />;
      case 'whisper':
        return <VolumeX className="w-4 h-4 text-teal-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
        Speech Emotion / Tone
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] hover:bg-neutral-50 dark:hover:bg-[#202020] text-neutral-900 dark:text-neutral-100 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 text-sm"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2.5 truncate">
          {getEmotionIcon(selectedEmotion.id)}
          <span className="font-medium">{selectedEmotion.label}</span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline">
            — {selectedEmotion.description}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-40 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] shadow-xl py-1 text-sm max-h-60 overflow-y-auto">
          {EMOTIONS.map((emotion) => {
            const isSelected = emotion.id === selectedEmotion.id;
            return (
              <button
                key={emotion.id}
                type="button"
                onClick={() => {
                  onChange(emotion);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start space-x-3 px-3.5 py-2 text-left transition-colors ${
                  isSelected
                    ? 'bg-neutral-100 dark:bg-[#222222] text-neutral-950 dark:text-white font-medium'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#202020]'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getEmotionIcon(emotion.id)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span>{emotion.label}</span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1">
                    {emotion.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
