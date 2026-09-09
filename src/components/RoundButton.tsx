import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { COLORS } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'plain' | 'primary' | 'danger';
  style?: ViewStyle;
};

export function RoundButton({ label, onPress, disabled, tone = 'plain', style }: Props) {
  const bg =
    tone === 'primary' ? COLORS.coloringInk : tone === 'danger' ? '#E53935' : COLORS.card;
  const fg = tone === 'plain' ? COLORS.ink : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}
      hitSlop={8}
    >
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minWidth: 64,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  label: { fontSize: 22, fontWeight: '700' },
});
