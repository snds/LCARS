import { useEffect, useRef, useSyncExternalStore } from 'react';
import { TOKENS, tokensToCssVars } from '@/constitution';
import { RoleIdSchema } from '@/ir/schema';
import type { RoleId } from '@/ir/types';
import { MockPlanner } from '@/planner';
import { createRuntime, probeVoiceAperture, startVoiceListen } from '@/runtime';
import { SurfaceHost } from './SurfaceHost';
import './shell.css';

function createAppRuntime() {
  return createRuntime({ planner: new MockPlanner(), initialRole: 'physicist' });
}

export function App() {
  const runtimeRef = useRef<ReturnType<typeof createAppRuntime> | null>(null);
  if (!runtimeRef.current) {
    runtimeRef.current = createAppRuntime();
  }
  const runtime = runtimeRef.current;

  const ir = useSyncExternalStore(
    (listener) => runtime.subscribe(listener),
    () => runtime.getIR(),
    () => runtime.getIR(),
  );

  const profile = useSyncExternalStore(
    (listener) => runtime.subscribe(listener),
    () => runtime.getProfile(),
    () => runtime.getProfile(),
  );

  const stopListenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      stopListenRef.current?.();
      stopListenRef.current = null;
    };
  }, []);

  const handleVoice = () => {
    if (probeVoiceAperture() === 'unsupported') {
      runtime.markVoiceDegraded();
      return;
    }

    stopListenRef.current?.();
    stopListenRef.current = startVoiceListen({
      onResult: (transcript) => {
        stopListenRef.current?.();
        stopListenRef.current = null;
        void runtime.submitIntent(transcript, 'voice');
      },
      onError: () => {
        stopListenRef.current = null;
        runtime.markVoiceDegraded();
      },
    });

    if (!stopListenRef.current) {
      runtime.markVoiceDegraded();
    }
  };

  return (
    <>
      <style>{tokensToCssVars(TOKENS)}</style>
      <div className="lcars-app">
      <div className="lcars-chrome">
        <label htmlFor="combadge-role">Combadge role</label>
        <select
          id="combadge-role"
          aria-label="Combadge role"
          value={profile.role}
          onChange={(event) => runtime.setRole(event.target.value as RoleId)}
        >
          {RoleIdSchema.options.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="lcars-module lcars-action-pill"
          aria-label="Voice command"
          onClick={handleVoice}
        >
          VOICE
        </button>
      </div>
      <SurfaceHost
        ir={ir}
        handlers={{
          onIntent: (text) => {
            void runtime.submitIntent(text, 'typed');
          },
        }}
      />
      </div>
    </>
  );
}
