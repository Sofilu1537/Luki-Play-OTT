import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { APP } from '../styles/theme';

/**
 * Props for the {@link Button} component.
 *
 * @property onPress   - Callback invoked when the button is tapped.
 * @property title     - Label text displayed on the button.
 * @property isLoading - When true, replaces the label with a loading spinner and disables the press.
 */
interface ButtonProps {
    onPress: () => void;
    title: string;
    isLoading?: boolean;
}

/**
 * Primary action button styled with the LUKI design system (NativeWind).
 *
 * Renders a full-width amber button. While `isLoading` is true the button is
 * disabled and shows an `ActivityIndicator` instead of the label text.
 *
 * @param props - {@link ButtonProps}
 */
export const Button = ({ onPress, title, isLoading }: ButtonProps) => (
    <TouchableOpacity
        className="bg-luki-accent w-full p-4 rounded-lg items-center justify-center active:opacity-80 mt-2 shadow-lg shadow-luki-accent/20"
        onPress={onPress}
        disabled={isLoading}
    >
        {isLoading ? (
            <ActivityIndicator color={APP.gradientStart} />
        ) : (
            <Text className="text-luki-purple font-bold text-lg uppercase tracking-wider">
                {title}
            </Text>
        )}
    </TouchableOpacity>
);