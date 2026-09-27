import type { ImageSourcePropType } from 'react-native';

// Decide the try-on body image the studio should show. The saved person photo
// (`person_photo_uri`, persisted by the Me tab) wins when set; otherwise the
// bundled sample is used. A per-session "Pick photo" override is applied through
// this same resolver with the picked uri, so — being applied after the mount
// seed — it always replaces the seeded body. Pure so it is unit-testable without
// a store or a mounted screen.
export function resolveBodySource(
  savedUri: string | null | undefined,
  sample: ImageSourcePropType,
): ImageSourcePropType {
  return savedUri ? { uri: savedUri } : sample;
}
