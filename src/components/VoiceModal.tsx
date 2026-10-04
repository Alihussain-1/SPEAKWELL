'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Play,
  Square,
  Loader2,
  SlidersHorizontal,
  Star,
  RotateCcw,
  Filter,
  Check,
} from 'lucide-react';
import { VoiceOption } from '@/types/tts';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: VoiceOption | null;
  onSelectVoice: (voice: VoiceOption) => void;
  voices: VoiceOption[];
  isLoadingVoices: boolean;
}

const FAVORITES_STORAGE_KEY = 'tts_favorite_voices';

export default function VoiceModal({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  voices,
  isLoadingVoices,
}: VoiceModalProps) {
  const [search, setSearch] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Preview state
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewLoadingVoiceId, setPreviewLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed);
          return;
        }
      }
      // Default initial favorites
      const defaults = ['en-US-JennyNeural', 'en-US-GuyNeural'];
      setFavoriteIds(defaults);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(defaults));
    } catch (e) {
      console.error('Failed to load favorite voices:', e);
    }
  }, []);

  // Stop preview on close
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setPreviewingVoiceId(null);
      setPreviewLoadingVoiceId(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Extract unique languages and countries from voices list
  const { availableLanguages, availableCountries } = useMemo(() => {
    const langs = new Set<string>();
    const countries = new Set<string>();

    voices.forEach((v) => {
      if (v.language) langs.add(v.language);
      if (v.country) countries.add(v.country);
    });

    return {
      availableLanguages: Array.from(langs).sort(),
      availableCountries: Array.from(countries).sort(),
    };
  }, [voices]);

  // Toggle favorite voice
  const handleToggleFavorite = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (favoriteIds.includes(voiceId)) {
      updated = favoriteIds.filter((id) => id !== voiceId);
    } else {
      updated = [...favoriteIds, voiceId];
    }
    setFavoriteIds(updated);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to persist favorite voices:', err);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedGender('All');
    setSelectedLanguage('All');
    setSelectedCountry('All');
    setShowFavoritesOnly(false);
  };

  // Filter voices
  const filteredVoices = useMemo(() => {
    const q = search.toLowerCase().trim();

    return voices.filter((v) => {
      // Favorite filter
      if (showFavoritesOnly && !favoriteIds.includes(v.id)) {
        return false;
      }

      // Gender filter
      if (selectedGender !== 'All') {
        if (v.gender.toLowerCase() !== selectedGender.toLowerCase()) {
          return false;
        }
      }

      // Language filter
      if (selectedLanguage !== 'All') {
        if (v.language !== selectedLanguage) {
          return false;
        }
      }

      // Country filter
      if (selectedCountry !== 'All') {
        if (v.country !== selectedCountry) {
          return false;
        }
      }

      // Search query
      if (!q) return true;

      return (
        v.displayName.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.localeName.toLowerCase().includes(q) ||
        v.language.toLowerCase().includes(q) ||
        v.country.toLowerCase().includes(q) ||
        v.friendlyName.toLowerCase().includes(q)
      );
    });
  }, [
    voices,
    search,
    selectedGender,
    selectedLanguage,
    selectedCountry,
    showFavoritesOnly,
    favoriteIds,
  ]);

  // Fast voice preview handler
  const handlePreviewVoice = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();

    if (previewingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPreviewingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    try {
      setPreviewLoadingVoiceId(voice.id);
      setPreviewingVoiceId(null);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello, this is a preview of my voice.',
          voice: voice.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.audioUrl) {
        throw new Error(data.error || 'Failed to preview voice');
      }

      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPreviewingVoiceId(null);
      };

      audio.onerror = () => {
        setPreviewingVoiceId(null);
      };

      await audio.play();
      setPreviewingVoiceId(voice.id);
    } catch (err) {
      console.error('Failed to preview voice:', err);
    } finally {
      setPreviewLoadingVoiceId(null);
    }
  };

  if (!isOpen) return null;

  const hasActiveFilters =
    selectedGender !== 'All' ||
    selectedLanguage !== 'All' ||
    selectedCountry !== 'All';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] shadow-2xl overflow-hidden z-10">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Select free voice
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Search, filter, and choose a voice for this generation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#202020] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls: Search Bar + Filters Button + Star Button + Reset Button */}
        <div className="px-6 py-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search voices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 shadow-sm"
              />
            </div>

            {/* Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border transition-colors shadow-sm shrink-0 ${
                isFiltersOpen || hasActiveFilters
                  ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#202020]'
              }`}
              title="Toggle Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Favorite Filter Button */}
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`p-2 rounded-xl border transition-colors shadow-sm shrink-0 ${
                showFavoritesOnly
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#202020]'
              }`}
              title={showFavoritesOnly ? 'Show All Voices' : 'Show Favorite Voices Only'}
            >
              <Star
                className={`w-4 h-4 ${
                  showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>

            {/* Reset / Refresh Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-[#202020] transition-colors shadow-sm shrink-0"
              title="Reset all search and filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Expandable Filter Row: Gender, Language, Country */}
          {isFiltersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#181818]/60 animate-fadeIn">
              {/* Gender Filter */}
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  Gender
                </label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              {/* Language Filter */}
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                >
                  <option value="All">All</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                >
                  <option value="All">All</option>
                  {availableCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Voices Count Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              Showing {filteredVoices.length} of {voices.length} free voices
              {showFavoritesOnly && ' (Favorites)'}
            </span>
          </div>
        </div>

        {/* Voices Grid (2 Columns as shown in screenshot) */}
        <div className="flex-1 overflow-y-auto px-6 py-3 min-h-[340px]">
          {isLoadingVoices ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <Loader2 className="w-7 h-7 animate-spin mb-3 text-neutral-500" />
              <p className="text-sm font-medium">Loading Edge TTS voices...</p>
            </div>
          ) : filteredVoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <Filter className="w-8 h-8 mb-2 stroke-1 text-neutral-400" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No voices found matching your criteria
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 text-xs text-neutral-900 dark:text-white underline hover:no-underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoice?.id === voice.id;
                const isFavorite = favoriteIds.includes(voice.id);
                const isPreviewing = previewingVoiceId === voice.id;
                const isPreviewLoading = previewLoadingVoiceId === voice.id;

                return (
                  <div
                    key={voice.id}
                    onClick={() => {
                      onSelectVoice(voice);
                      onClose();
                    }}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 dark:border-neutral-200 bg-neutral-100/90 dark:bg-[#202020]'
                        : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#181818]'
                    }`}
                  >
                    {/* Left: Name and Language - Country - Gender */}
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {voice.displayName}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                        {voice.language} - {voice.country} - {voice.gender}
                      </p>
                    </div>

                    {/* Right: Play preview button & Favorite Star button */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {/* Play Preview Button */}
                      <button
                        type="button"
                        title={isPreviewing ? 'Stop Preview' : 'Play voice sample'}
                        onClick={(e) => handlePreviewVoice(voice, e)}
                        disabled={isPreviewLoading}
                        className={`p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors ${
                          isPreviewing ? 'text-neutral-900 dark:text-white' : ''
                        }`}
                      >
                        {isPreviewLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                        ) : isPreviewing ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 stroke-[2]" />
                        )}
                      </button>

                      {/* Favorite Star Button */}
                      <button
                        type="button"
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        onClick={(e) => handleToggleFavorite(voice.id, e)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${
                            isFavorite
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-400 hover:text-amber-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#111111]/60 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>
            {favoriteIds.length} favorited voice{favoriteIds.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] hover:bg-neutral-100 dark:hover:bg-[#222222] text-neutral-800 dark:text-neutral-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
