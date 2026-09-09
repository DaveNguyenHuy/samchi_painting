import { useRouter } from 'expo-router';
import { FreeDrawScreen } from '../src/screens/FreeDrawScreen';

export default function Draw() {
  const router = useRouter();
  return <FreeDrawScreen onBack={() => router.back()} />;
}
