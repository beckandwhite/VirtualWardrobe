import * as ImagePicker from 'expo-image-picker';

// Native/default image-library picker. Web overrides this with `pickImage.web.ts`,
// which uses a real `input.click()` so Safari/WebKit actually opens the dialog
// (expo-image-picker's web path fires a synthetic click WebKit refuses — see
// pickImage.web.ts for the full note). Screens call `pickImageFromLibrary()`
// and get back a persisted-enough URI, or null on cancel/denial.
export interface PickedImage {
   uri: string;
}

export async function pickImageFromLibrary(): Promise<PickedImage | null> {
   const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
   if (!perm.granted) return null;
   const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
   });
   if (res.canceled || !res.assets?.[0]) return null;
   return { uri: res.assets[0].uri };
}
