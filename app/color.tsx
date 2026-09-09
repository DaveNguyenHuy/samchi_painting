import { useRouter } from 'expo-router';
import { ColoringScreen } from '../src/screens/ColoringScreen';

export default function Color() {
  const router = useRouter();
  return <ColoringScreen onBack={() => router.back()} />;
}
