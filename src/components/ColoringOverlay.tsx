import { Group, Path } from '@shopify/react-native-skia';
import type { Region } from '../coloring/pages';

type Props = {
  regions: Region[];
  translateX: number;
  translateY: number;
  scale: number;
};

/** The black line art of a colouring page, drawn on top of the child's paint. */
export function ColoringOverlay({ regions, translateX, translateY, scale }: Props) {
  return (
    <Group transform={[{ translateX }, { translateY }, { scale }]}>
      {regions.map((r) =>
        r.kind === 'ink' ? (
          <Path key={r.id} path={r.path} color="#111111" />
        ) : (
          <Path
            key={r.id}
            path={r.path}
            color="#1A1A1A"
            style="stroke"
            strokeWidth={r.kind === 'line' ? 7 : 6}
            strokeJoin="round"
            strokeCap="round"
          />
        ),
      )}
    </Group>
  );
}
