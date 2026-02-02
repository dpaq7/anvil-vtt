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

const sceneColors: Record<string, string> = {
  battle: 'border-l-red-500',
  story: 'border-l-purple-500',
  montage: 'border-l-amber-500',
  negotiation: 'border-l-blue-500',
  respite: 'border-l-green-500',
};

export function CardGrid({ items, onSelect, onDoubleClick }: CardGridProps) {
  if (items.length === 0) {
    return <p className="p-8 text-zinc-500">No items yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.id}
          className={`cursor-pointer border-l-4 transition hover:border-zinc-600 ${item.type ? sceneColors[item.type] ?? 'border-l-zinc-700' : 'border-l-zinc-700'}`}
          onClick={() => onSelect(item.id)}
          onDoubleClick={() => onDoubleClick?.(item.id)}
        >
          <CardHeader>
            <CardTitle className="text-base">{item.title}</CardTitle>
          </CardHeader>
          {item.subtitle && (
            <CardContent>
              <p className="text-sm text-zinc-400">{item.subtitle}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
