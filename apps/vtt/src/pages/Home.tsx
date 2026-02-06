import { RoleToggle } from '@anvil/ui';
import { useAuthStore } from '../stores/authStore';

export function Home() {
  const user = useAuthStore((s) => s.user);
  const setRole = useAuthStore((s) => s.setRole);

  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-100">Welcome to Anvil</h1>
        <p className="mt-2 text-zinc-400">Your virtual tabletop for Draw Steel.</p>
        <div className="mt-8">
          <RoleToggle
            value={user?.role ?? 'director'}
            onValueChange={setRole}
          />
        </div>
      </div>
    </div>
  );
}
