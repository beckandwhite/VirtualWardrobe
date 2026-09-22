import React from 'react';
import { View, Text } from 'react-native';
import type { FilePickerButtonProps } from './FilePickerButton';

// Web file-picker button: a <label> that covers the button area with a hidden
// <input type="file"> as its activation target. The browser natively forwards
// a trusted label click to the file input — no JavaScript input.click() needed,
// so Safari's user-activation requirement is always satisfied regardless of how
// many async frames separate the user gesture from our code.

export function FilePickerButton({
  children,
  style,
  labelStyle,
  disabled,
  onPick,
}: FilePickerButtonProps) {
  const id = React.useId();

  return (
    <View style={[{ position: 'relative' }, style]}>
      <Text style={labelStyle}>{children}</Text>
      {React.createElement('label', {
        htmlFor: disabled ? undefined : id,
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: disabled ? 'default' : 'pointer',
        },
        children: React.createElement('input', {
          key: 'input',
          id,
          type: 'file',
          accept: 'image/*',
          disabled,
          style: { position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 },
          onChange: (e: { target: { files: FileList | null; value: string } }) => {
            const file = e.target.files?.[0];
            if (file) onPick(URL.createObjectURL(file));
            e.target.value = '';
          },
        }),
      })}
    </View>
  );
}
