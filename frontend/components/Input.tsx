import { TextInput, View, Text, KeyboardTypeOptions } from 'react-native';

/**
 * Props for the {@link Input} component.
 *
 * @property value           - Controlled input value.
 * @property onChangeText    - Callback fired on every text change.
 * @property placeholder     - Placeholder string shown when the field is empty.
 * @property secureTextEntry - When true, masks the input (password mode).
 * @property label           - Optional label displayed above the field.
 * @property keyboardType    - Optional keyboard type for the input.
 * @property maxLength       - Optional maximum number of characters.
 */
interface InputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    label?: string;
    keyboardType?: KeyboardTypeOptions;
    maxLength?: number;
}

/**
 * Styled text input field for the LUKI design system.
 *
 * Wraps React Native's `TextInput` with an optional label, consistent
 * semi-transparent background and a focused accent border.
 *
 * @param props - {@link InputProps}
 */
export const Input = ({ value, onChangeText, placeholder, secureTextEntry, label, keyboardType, maxLength }: InputProps) => (
    <View className="mb-4 w-full">
        {label && <Text className="text-gray-300 mb-2 ml-1 font-medium">{label}</Text>}
        <TextInput
            className="bg-white/10 text-white p-4 rounded-lg border border-white/20 focus:border-luki-accent font-medium"
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
            keyboardType={keyboardType}
            maxLength={maxLength}
        />
    </View>
);