import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Progress, Tabs, TabsContent, TabsList, TabsTrigger, cn } from '@anvil/ui';
import { AlertTriangle, CircleUserRound, Database, Download, HardDrive, Settings, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react';
import { useAuthStore } from '../stores/authStore.js';
import { csrfHeaders } from '../lib/csrf.js';
import { TourSettingToggle } from '../components/onboarding/TourSettingToggle.js';

type AccountSection = 'profile' | 'settings' | 'data';
type UserRole = 'director' | 'player';

const API_BASE = import.meta.env['VITE_API_BASE'] || '';

interface StorageUsage {
  usedBytes: number;
  limitBytes: number;
  usedPercent: number;
  assetCount: number;
  assetLimit: number;
  uploadedAssetCount: number;
  pendingAssetCount: number;
}

const SECTIONS: Array<{ id: AccountSection; label: string; icon: typeof CircleUserRound }> = [
  { id: 'profile', label: 'Profile', icon: CircleUserRound },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'data', label: 'Data', icon: Database },
];

function getSection(value: string | null): AccountSection {
  if (value === 'export') return 'data';
  return SECTIONS.some((section) => section.id === value) ? (value as AccountSection) : 'profile';
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const maximumFractionDigits = unitIndex === 0 || value >= 10 ? 0 : 1;
  return `${value.toLocaleString(undefined, { maximumFractionDigits })} ${units[unitIndex]}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: value >= 10 ? 0 : 1 })}%`;
}

export function Account() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const setRole = useAuthStore((state) => state.setRole);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [storageStatus, setStorageStatus] = useState<string | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const section = getSection(searchParams.get('section'));
  const userId = user?.id ?? null;
  const deleteConfirmationMatches = Boolean(user && deleteConfirmation === user.username);

  const initials = (user?.username ?? 'Account')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSectionChange = (value: string) => {
    setSearchParams({ section: getSection(value) });
  };

  const loadStorageUsage = useCallback(async () => {
    if (!userId) {
      setStorageUsage(null);
      setStorageStatus(null);
      return;
    }

    setLoadingStorage(true);
    setStorageStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/account/storage`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const body = await res.json().catch(() => ({ error: res.statusText })) as StorageUsage & { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Storage usage unavailable');
      setStorageUsage(body);
    } catch (error) {
      setStorageStatus(error instanceof Error ? error.message : 'Storage usage unavailable');
      setStorageUsage(null);
    } finally {
      setLoadingStorage(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadStorageUsage();
  }, [loadStorageUsage]);

  const handleRoleChange = async (role: UserRole) => {
    if (!user || user.role === role || pendingRole) return;
    setPendingRole(role);
    try {
      if (import.meta.env.DEV) {
        const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        const params = new URLSearchParams({ role, next, format: 'json' });
        const res = await fetch(`${API_BASE}/api/auth/dev-login?${params.toString()}`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to switch development role');
        await checkAuth();
        return;
      }

      await setRole(role);
    } finally {
      setPendingRole(null);
    }
  };

  const handleBackupDownload = async () => {
    setBackupStatus('Preparing backup...');
    const res = await fetch(`${API_BASE}/api/account/backup`, { credentials: 'include' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
      setBackupStatus(body.error ?? 'Backup failed');
      return;
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    const fileName = disposition?.match(/filename="([^"]+)"/)?.[1] ?? 'anvil-account-backup.anv';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setBackupStatus('Backup downloaded.');
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoreStatus('Restoring backup...');
    const form = new FormData();
    form.append('backup', restoreFile);

    const res = await fetch(`${API_BASE}/api/account/restore`, {
      method: 'POST',
      credentials: 'include',
      headers: csrfHeaders('POST'),
      body: form,
    });
    const body = await res.json().catch(() => ({ error: res.statusText })) as {
      ok?: boolean;
      error?: string;
      counts?: Record<string, number>;
    };

    if (!res.ok || !body.ok) {
      setRestoreStatus(body.error ?? 'Restore failed');
      return;
    }

    await checkAuth();
    await loadStorageUsage();
    const restored = body.counts
      ? [
          `${body.counts['campaigns'] ?? 0} campaigns`,
          `${body.counts['game_sessions'] ?? 0} sessions`,
          `${body.counts['heroes'] ?? 0} characters`,
          `${body.counts['assets'] ?? 0} assets`,
          `${body.counts['files'] ?? 0} files`,
        ].join(', ')
      : 'backup data';
    setRestoreStatus(`Restore complete: ${restored}.`);
    setRestoreFile(null);
    if (restoreInputRef.current) restoreInputRef.current.value = '';
  };

  const handleDeleteAccount = async () => {
    if (!user || !deleteConfirmationMatches || deletingAccount) return;
    setDeletingAccount(true);
    setDeleteStatus('Deleting account...');

    const res = await fetch(`${API_BASE}/api/account`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders('DELETE') },
      body: JSON.stringify({ confirmation: deleteConfirmation }),
    });
    const body = await res.json().catch(() => ({ error: res.statusText })) as { ok?: boolean; error?: string };

    if (!res.ok || !body.ok) {
      setDeleteStatus(body.error ?? 'Account deletion failed');
      setDeletingAccount(false);
      return;
    }

    setDeleteStatus('Account deleted.');
    await checkAuth();
    window.location.assign('/');
  };

  return (
    <div className="min-h-full bg-zinc-950 px-6 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 text-lg font-bold text-zinc-200">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Account</p>
              <h1 className="mt-1 text-2xl font-bold">{user?.username ?? 'Profile'}</h1>
              <p className="mt-1 text-sm capitalize text-zinc-400">{user?.role ?? 'user'} flow</p>
            </div>
          </div>
        </div>

        <Tabs value={section} onValueChange={handleSectionChange}>
          <TabsList className="mb-6 grid h-auto w-full grid-cols-3 bg-zinc-900 sm:inline-grid sm:w-auto">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="gap-2">
                <Icon className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserRound className="size-5 text-cyan-300" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Username</p>
                    <p className="mt-1 text-zinc-100">{user?.username ?? 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Avatar</p>
                    <p className="mt-1 text-zinc-300">{user?.avatarUrl ? 'Connected' : 'Using initials'}</p>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-400">
                    Internal account identifiers are hidden from this view.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="size-5 text-emerald-300" />
                    Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-zinc-300">
                  <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                    <span>Current flow</span>
                    <span className="capitalize text-zinc-100">{user?.role ?? 'User'}</span>
                  </div>
                  <p className="leading-6 text-zinc-500">
                    The active flow controls which navigation and tools appear in the app rail.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="size-5 text-amber-300" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Default flow</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Switch between Director and Player from here or from the left rail.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(['director', 'player'] as const).map((role) => (
                      <Button
                        key={role}
                        variant={user?.role === role ? 'default' : 'outline'}
                        disabled={pendingRole !== null}
                        onClick={() => handleRoleChange(role)}
                        className={cn('capitalize', pendingRole === role && 'cursor-wait')}
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-5">
                  <TourSettingToggle
                    userId={user?.id}
                    roleKey={user?.role === 'player' ? 'player' : 'director'}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="size-5 text-violet-300" />
                  Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-zinc-100">Storage usage</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        Uploaded assets count toward the account storage quota.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      <HardDrive className="size-4 text-cyan-300" />
                      {storageUsage ? formatPercent(storageUsage.usedPercent) : loadingStorage ? 'Loading' : 'Unavailable'}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress
                      value={storageUsage?.usedPercent ?? 0}
                      className="h-2 bg-zinc-800"
                      aria-label="Account storage used"
                    />
                    {storageUsage ? (
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
                        <span>{formatBytes(storageUsage.usedBytes)} used</span>
                        <span>{formatBytes(storageUsage.limitBytes)} cap</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-500">
                        {loadingStorage ? 'Calculating storage usage...' : 'Storage usage is not available.'}
                      </p>
                    )}
                  </div>

                  {storageUsage ? (
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                      <div className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-zinc-600">Assets</p>
                        <p className="mt-1 text-zinc-200">
                          {storageUsage.assetCount.toLocaleString()} / {storageUsage.assetLimit.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-zinc-600">Uploaded</p>
                        <p className="mt-1 text-zinc-200">{storageUsage.uploadedAssetCount.toLocaleString()}</p>
                      </div>
                      <div className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-zinc-600">Pending</p>
                        <p className="mt-1 text-zinc-200">{storageUsage.pendingAssetCount.toLocaleString()}</p>
                      </div>
                    </div>
                  ) : null}

                  {storageStatus ? <p className="mt-3 text-sm text-zinc-400">{storageStatus}</p> : null}
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="font-medium text-zinc-100">Backup archive</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Download one .anv archive containing account data, assets, sessions,
                    characters, NPCs, maps, audio, notes, and campaign prep data.
                  </p>
                  <Button className="mt-4 gap-2" onClick={() => void handleBackupDownload()} disabled={!user}>
                    <Download className="size-4" />
                    Download .anv Backup
                  </Button>
                  {backupStatus ? <p className="mt-3 text-sm text-zinc-400">{backupStatus}</p> : null}
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="font-medium text-zinc-100">Import backup</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Restore from a .anv archive. Matching records are updated and archived records
                    are added back into the current account.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      ref={restoreInputRef}
                      type="file"
                      accept=".anv,application/vnd.anvil.backup+json,application/json"
                      className="block w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-950 text-sm text-zinc-300 file:mr-4 file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-100 hover:file:bg-zinc-700"
                      onChange={(event) => {
                        setRestoreFile(event.target.files?.[0] ?? null);
                        setRestoreStatus(null);
                      }}
                    />
                    <Button
                      className="shrink-0 gap-2"
                      onClick={() => void handleRestore()}
                      disabled={!restoreFile}
                    >
                      <Upload className="size-4" />
                      Restore
                    </Button>
                  </div>
                  {restoreFile ? (
                    <p className="mt-3 text-sm text-zinc-400">Selected: {restoreFile.name}</p>
                  ) : null}
                  {restoreStatus ? <p className="mt-3 text-sm text-zinc-400">{restoreStatus}</p> : null}
                </div>

                <div className="rounded-lg border border-red-900/70 bg-red-950/20 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-300" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-red-100">Delete Your Account</p>
                      <p className="mt-1 text-sm leading-6 text-red-100/70">
                        Permanently delete this account, owned campaigns, sessions, characters,
                        NPCs, maps, audio, notes, uploaded assets, and sign-in records. This cannot
                        be undone.
                      </p>
                      <p className="mt-4 text-sm text-red-100/80">
                        To confirm, type{' '}
                        <span className="rounded bg-red-950 px-1.5 py-0.5 font-mono text-red-100">
                          {user?.username ?? 'your username'}
                        </span>{' '}
                        below.
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <Input
                          value={deleteConfirmation}
                          onChange={(event) => {
                            setDeleteConfirmation(event.target.value);
                            setDeleteStatus(null);
                          }}
                          aria-label="Account deletion confirmation"
                          autoComplete="off"
                          spellCheck={false}
                          className="border-red-900/70 bg-zinc-950/80 font-mono text-red-50 placeholder:text-red-200/30 focus-visible:ring-red-400"
                          placeholder={user?.username ?? 'Type your username'}
                        />
                        <Button
                          variant="destructive"
                          className="shrink-0 gap-2"
                          disabled={!deleteConfirmationMatches || deletingAccount}
                          onClick={() => void handleDeleteAccount()}
                        >
                          <Trash2 className="size-4" />
                          Delete Account
                        </Button>
                      </div>
                      {deleteStatus ? <p className="mt-3 text-sm text-red-100/80">{deleteStatus}</p> : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
