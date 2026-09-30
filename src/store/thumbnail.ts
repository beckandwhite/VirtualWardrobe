import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// M1-2: shrink a full-resolution capture to a small thumbnail so the gallery
// (M1-3) never has to decode megabytes on scroll. The full-res image stays in
// `Item.imagePath`; only the thumbnail is what a list decodes.
//
// #64: thumbnails are PNG so a transparent-PNG cutout keeps its alpha in the
// wardrobe grid (a JPEG thumb would flatten the cutout onto a black matte). A
// passthrough JPEG source is simply re-wrapped as PNG — larger, but correct.
//
// Best-effort: on any failure we fall back to the original path so a thumb never
// blocks the user. RN-only module: imported by the item screen, never by the node
// test suite.
export const THUMB_SIZE = 400;

export async function makeThumbnail(fullPath: string, size = THUMB_SIZE): Promise<string> {
   try {
      const res = await manipulateAsync(
         fullPath,
         [{ resize: { width: size, height: size } }],
         { format: SaveFormat.PNG },
      );
      return res.uri;
      } catch (e) {
       console.warn('makeThumbnail failed, using full image:', e);
       return fullPath;
       }
}
