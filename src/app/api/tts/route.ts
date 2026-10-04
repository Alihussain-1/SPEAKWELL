import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSpeechWithSrt, getVoicesList } from '@/lib/edge-tts';
import { TTSRequest } from '@/types/tts';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const voices = await getVoicesList();
    return NextResponse.json({
      success: true,
      voices,
    });
  } catch (error: any) {
    console.error('Error fetching TTS voices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch voices',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: TTSRequest = await req.json();
    const { text, voice, rate, pitch, volume } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Text field is required and must not be empty.',
        },
        { status: 400 }
      );
    }

    // Purely in-memory Edge TTS synthesis with SRT timestamps extraction
    const { buffer, srtContent } = await synthesizeSpeechWithSrt({
      text: text.trim(),
      voice: voice || 'en-US-JennyNeural',
      rate,
      pitch,
      volume,
    });

    const base64Audio = buffer.toString('base64');
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      audioUrl,
      srtContent,
    });
  } catch (error: any) {
    console.error('TTS Synthesis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred during audio synthesis',
      },
      { status: 500 }
    );
  }
}
