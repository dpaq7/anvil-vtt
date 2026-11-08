import { Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';

interface CardItem {
  id: string;
  title: string;
  subtitle?: string;
  type?: string;
}

interface CardGridProps {
  items: CardItem[];
  onSelect: (id: string) => void;
  onDoubleClick?: (id: string) => void;
}

// Scene mode colours (DESIGN.md 2.2): identity, with fixed text on each.
const sceneAccents: Record<string, { color: string; onColor: string; label: string }> = {
  battle: { color: 'var(--color-scene-battle)', onColor: 'var(--color-on-scene-battle)', label: 'Battle' },
  story: { color: 'var(--color-scene-story)', onColor: 'var(--color-on-scene-story)', label: 'Story' },
  montage: { color: 'var(--color-scene-montage)', onColor: 'var(--color-on-scene-montage)', label: 'Montage' },
  negotiation: {
    color: 'var(--color-scene-negotiation)',
    onColor: 'var(--color-on-scene-negotiation)',
    label: 'Negotiation',
  },
  respite: { color: 'var(--color-scene-respite)', onColor: 'var(--color-on-scene-respite)', label: 'Respite' },
};

export function CardGrid({ items, onSelect, onDoubleClick }: CardGridProps) {
  if (items.length === 0) {
    return <p className="p-8 text-zinc-500">No items yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const accent = item.type ? sceneAccents[item.type] : undefined;

        return (
          <Card
            key={item.id}
            className="relative overflow-hidden cursor-pointer border-l-4 border-l-zinc-700 bg-zinc-900 transition hover:border-zinc-600"
            style={{
              borderLeftColor: accent?.color,
              backgroundImage: accent
                ? `linear-gradient(270deg, ${accent.color} 0%, color-mix(in srgb, ${accent.color} 60%, transparent) 18%, var(--color-surface) 68%)`
                : undefined,
            }}
            onClick={() => onSelect(item.id)}
            onDoubleClick={() => onDoubleClick?.(item.id)}
          >
            <CardHeader className="relative z-10">
              <CardTitle className="text-base text-text">{item.title}</CardTitle>
              {accent && (
                <span
                  className="mt-2 w-fit px-1.5 py-0.5 text-xs font-black uppercase leading-none tracking-[0.18em]"
                  style={{ backgroundColor: accent.color, color: accent.onColor }}
                >
                  {accent.label}
                </span>
              )}
            </CardHeader>
            {item.subtitle && (
              <CardContent className="relative z-10">
                <p className="text-sm text-zinc-400">{item.subtitle}</p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
