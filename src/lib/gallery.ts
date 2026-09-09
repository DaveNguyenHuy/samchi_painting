import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import type { SkImage } from '@shopify/react-native-skia';

const DIR_NAME = 'artwork';

function artworkDir(): Directory {
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export type Artwork = {
  name: string;
  uri: string;
  modified: number;
};

/** Newest first. */
export function listArtwork(): Artwork[] {
  const dir = artworkDir();
  const items: Artwork[] = [];
  for (const entry of dir.list()) {
    if (entry instanceof File && entry.name.endsWith('.png')) {
      items.push({
        name: entry.name,
        uri: entry.uri,
        modified: entry.modificationTime ?? 0,
      });
    }
  }
  return items.sort((a, b) => b.modified - a.modified);
}

/** Save a Skia snapshot to the in-app gallery. Returns the file uri. */
export function saveArtwork(image: SkImage): string {
  const bytes = image.encodeToBytes(); // PNG
  const file = new File(artworkDir(), `${Date.now()}.png`);
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}

export function deleteArtwork(name: string): void {
  const file = new File(artworkDir(), name);
  if (file.exists) file.delete();
}

/** Also copy a saved file into the iPad's Photos app. */
export async function exportToPhotos(uri: string): Promise<boolean> {
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) return false;
  await MediaLibrary.saveToLibraryAsync(uri);
  return true;
}
