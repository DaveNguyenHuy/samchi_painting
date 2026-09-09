import { useRouter } from 'expo-router';
import { HomeScreen } from '../src/screens/HomeScreen';

export default function Index() {
  const router = useRouter();
  return (
    <HomeScreen
      onFreeDraw={() => router.push('/draw')}
      onColoring={() => router.push('/color')}
      onGallery={() => router.push('/gallery')}
    />
  );
}
