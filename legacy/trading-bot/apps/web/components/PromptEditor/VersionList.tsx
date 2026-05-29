interface VersionListProps {
  versions: Array<{ id: string; label: string; active?: boolean }>;
}

export function VersionList({ versions }: VersionListProps) {
  return (
    <ul className="space-y-2">
      {versions.map((version) => (
        <li key={version.id} className={version.active ? 'font-semibold text-primary' : 'text-muted-foreground'}>
          {version.label}
        </li>
      ))}
    </ul>
  );
}
