import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Props = {
  icon: IconName;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: 'plain' | 'primary';
  size?: number;
};

export function RailButton({ icon, onPress, active, disabled, tone = 'plain', size = 30 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        active && styles.active,
        tone === 'primary' && styles.primary,
        { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={size}
        color={active ? COLORS.coloringInk : tone === 'primary' ? '#1B7A43' : COLORS.ink}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  active: { backgroundColor: '#EEEBFF', borderColor: COLORS.coloringInk },
  primary: { backgroundColor: '#D7F5E3', borderColor: '#8BD9AE' },
});
