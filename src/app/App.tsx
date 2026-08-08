import { useRef, useSyncExternalStore } from 'react';
import { RoleIdSchema } from '@/ir/schema';
import type { RoleId } from '@/ir/types';
import { MockPlanner } from '@/planner';
import { createRuntime } from '@/runtime';
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

  return (
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
  );
}
