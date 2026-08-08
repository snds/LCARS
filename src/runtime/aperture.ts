const COMPUTER_PREFIX = /^computer\s+/i;

export function stripComputerPrefix(text: string): string {
  return text.replace(COMPUTER_PREFIX, '').trim();
}

export type VoiceApertureStatus = 'available' | 'degraded' | 'unsupported';

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  abort(): void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function probeVoiceAperture(): VoiceApertureStatus {
  return getSpeechRecognitionCtor() ? 'available' : 'unsupported';
}

export type VoiceListenOptions = {
  onResult: (transcript: string) => void;
  onError?: () => void;
};

export function startVoiceListen(options: VoiceListenOptions): (() => void) | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    options.onError?.();
    return null;
  }

  const recognition = new Ctor();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? '';
    if (transcript.trim()) {
      options.onResult(stripComputerPrefix(transcript));
    }
  };

  recognition.onerror = () => {
    options.onError?.();
  };

  try {
    recognition.start();
  } catch {
    options.onError?.();
    return null;
  }

  return () => {
    recognition.abort();
  };
}
