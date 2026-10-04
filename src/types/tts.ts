export interface TTSRequest {
  text: string;
  voice: string;
  rate?: string;
  pitch?: string;
  volume?: string;
  emotion?: string;
}

export interface VoiceOption {
  id: string; // ShortName like "en-US-JennyNeural"
  name: string;
  displayName: string;
  gender: 'Female' | 'Male' | string;
  locale: string;
  localeName: string;
  friendlyName: string;
  country: string;
  language: string;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  srtContent?: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  voice: string;
  voiceDisplayName: string;
  audioUrl: string; // base64 data:audio/mp3;base64,...
  srtContent?: string; // standard SRT subtitle with timestamps
  createdAt: string;
  rate?: string;
  pitch?: string;
  emotion?: string;
}

export type EmotionOption = {
  id: string;
  label: string;
  rateOffset?: number; // e.g., 0.1 for +10%
  pitchOffset?: number; // e.g., 10 for +10Hz
  description: string;
};
