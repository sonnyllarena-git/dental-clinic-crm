import { FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui';

export function DemoDataBadge() {
  return (
    <Badge tone="warning" className="whitespace-nowrap">
      <FlaskConical className="h-3 w-3" aria-hidden />
      Demo data — not for clinical use
    </Badge>
  );
}
