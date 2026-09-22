import { TouchableOpacity, Text } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { pickImageFromLibrary } from './pickImage';

// Native file-picker button: TouchableOpacity that requests the image library.
// Web overrides this with FilePickerButton.web.tsx, which uses a label+input so
// the browser forwards the click to the file dialog natively (no JS gesture
// forwarding that Safari may reject).

export interface FilePickerButtonProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  onPick: (uri: string) => void;
}

export function FilePickerButton({
  children,
  style,
  labelStyle,
  disabled,
  onPick,
}: FilePickerButtonProps) {
  const handlePress = async () => {
    const picked = await pickImageFromLibrary();
    if (picked) onPick(picked.uri);
  };

  return (
    <TouchableOpacity
      style={style}
      disabled={disabled}
      activeOpacity={0.8}
      onPress={handlePress}>
      <Text style={labelStyle}>{children}</Text>
    </TouchableOpacity>
  );
}
