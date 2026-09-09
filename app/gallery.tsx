import { useRouter } from 'expo-router';
import { GalleryScreen } from '../src/screens/GalleryScreen';

export default function Gallery() {
  const router = useRouter();
  return <GalleryScreen onBack={() => router.back()} />;
}
