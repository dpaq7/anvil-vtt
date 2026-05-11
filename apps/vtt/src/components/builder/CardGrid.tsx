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

const sceneAccents: Record<string, { color: string; label: string }> = {
  battle: { color: '#ef4444', label: 'Battle' },
  story: { color: '#3b82f6', label: 'Story' },
  montage: { color: '#f59e0b', label: 'Montage' },
  negotiation: { color: '#a855f7', label: 'Negotiation' },
  respite: { color: '#10b981', label: 'Respite' },
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
                ? `linear-gradient(270deg, ${accent.color} 0%, ${accent.color}99 18%, rgba(39, 39, 42, 0.94) 68%)`
                : undefined,
            }}
            onClick={() => onSelect(item.id)}
            onDoubleClick={() => onDoubleClick?.(item.id)}
          >
            <CardHeader className="relative z-10">
              <CardTitle className="text-base text-white">{item.title}</CardTitle>
              {accent && (
                <span
                  className="mt-2 w-fit rounded-sm px-1.5 py-0.5 text-[0.55rem] font-black uppercase leading-none tracking-[0.18em] text-black"
                  style={{ backgroundColor: accent.color }}
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
