/**
 * CMS Reusable Components
 *
 * All components follow the Luki Play design system tokens from /cms-screen.md
 * Use C tokens (from CmsShell) for all colors - NEVER hardcode colors
 */

import React, { ReactNode } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, Pressable,
  ScrollView, Platform, ViewStyle, TextStyle,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../hooks/useTheme';
import { FONT_FAMILY } from '../../styles/typography';

// ─── StatCard ───────────────────────────────────────────────
/**
 * Metric card with icon, label, and value
 * @param label - Uppercase label (auto-uppercased)
 * @param value - Number or string value
 * @param icon - FontAwesome icon name
 * @param color - Icon and accent color
 */
export function StatCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg?: string;
}) {
  const { isDark, theme } = useTheme();
  return (
    <View style={{
      flex: 1, minWidth: 180,
      backgroundColor: theme.cardBg,
      borderRadius: 14, padding: 16,
      borderWidth: 1,
      borderColor: isDark ? theme.softUiBorderDark : theme.softUiBorder,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: theme.cardShadow,
      shadowOpacity: isDark ? 0.34 : 0.18,
      shadowRadius: isDark ? 16 : 12,
      shadowOffset: { width: isDark ? 8 : 6, height: isDark ? 8 : 6 },
      elevation: isDark ? 10 : 6,
      ...(Platform.OS === 'web' && !isDark ? { boxShadow: theme.softUiShadow } as any : {}),
      ...(Platform.OS === 'web' &&  isDark ? { boxShadow: theme.softUiShadowDark } as any : {}),
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: bg ?? `${color}18`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? `${color}35` : theme.iconBorderSoft }}>
          <FontAwesome name={icon as any} size={16} color={color} />
        </View>
        <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 15, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>{label}</Text>
      </View>
      <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 30, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>{value}</Text>
    </View>
  );
}

// ─── StatusBadge ────────────────────────────────────────────
/**
 * Status badge with color based on status type
 */
export function StatusBadge({
  status,
  color,
  icon,
}: {
  status: string;
  color: string;
  icon?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: `${color}20`,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      {icon && <FontAwesome name={icon as any} size={10} color={color} />}
      <Text
        style={{
          color: color,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
        }}
      >
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

// ─── PrimaryButton ──────────────────────────────────────────
/**
 * Accent-colored button (primary action)
 */
export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: disabled ? theme.textMuted : theme.accent,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {icon && (
        <FontAwesome
          name={icon as any}
          size={14}
          color="#1A1A2E"
        />
      )}
      <Text
        style={{
          color: '#1A1A2E',
          fontWeight: '800',
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── SecondaryButton ────────────────────────────────────────
/**
 * Border button (secondary action)
 */
export function SecondaryButton({
  label,
  icon,
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: 'transparent',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {icon && (
        <FontAwesome name={icon as any} size={12} color={theme.textSec} />
      )}
      <Text
        style={{
          color: theme.textSec,
          fontWeight: '600',
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── FormField ──────────────────────────────────────────────
/**
 * Label + input wrapper with optional hint
 */
export function FormField({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          color: theme.textMuted,
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        {label} {required && <Text style={{ color: theme.danger }}>*</Text>}
      </Text>
      {children}
      {hint && (
        <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 4 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

// ─── TextInputField ─────────────────────────────────────────
/**
 * Styled text input with C tokens
 */
export function TextInputField({
  value,
  onChangeText,
  placeholder,
  disabled = false,
  multiline = false,
  keyboardType = 'default',
  monospace = false,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  monospace?: boolean;
}) {
  const { theme } = useTheme();
  const webInput =
    Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  return (
    <TextInput
      style={{
        backgroundColor: theme.liftBg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: theme.text,
        fontSize: 13,
        fontFamily: monospace && Platform.OS === 'web' ? 'monospace' : undefined,
        minHeight: multiline ? 100 : 'auto',
        ...webInput,
      }}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.textMuted}
      editable={!disabled}
      multiline={multiline}
      keyboardType={keyboardType as any}
    />
  );
}

// ─── SelectPill ─────────────────────────────────────────────
/**
 * Selectable pill/chip (for single or multiple options)
 */
export function SelectPill({
  label,
  selected = false,
  onPress,
  color,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  color?: string;
}) {
  const { theme } = useTheme();
  const effectiveColor = color ?? theme.accent;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? effectiveColor : theme.border,
        backgroundColor: selected ? `${effectiveColor}20` : theme.liftBg,
      }}
    >
      <Text
        style={{
          color: selected ? effectiveColor : theme.textSec,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── EmptyState ─────────────────────────────────────────────
/**
 * Empty state placeholder with icon, title, and message
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
  actionLabel,
}: {
  icon: string;
  title: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 48,
        alignItems: 'center',
        gap: 14,
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 14,
          backgroundColor: theme.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FontAwesome name={icon as any} size={26} color={theme.accent} />
      </View>
      <Text
        style={{
          color: theme.text,
          fontSize: 15,
          fontWeight: '800',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.textMuted,
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 320,
        }}
      >
        {message}
      </Text>
      {action && actionLabel && (
        <PrimaryButton
          label={actionLabel}
          icon="plus"
          onPress={action}
          style={{ marginTop: 4 }}
        />
      )}
    </View>
  );
}

// ─── FeedbackBanner ─────────────────────────────────────────
/**
 * Success/error notification banner
 */
export function FeedbackBanner({
  type,
  message,
}: {
  type: 'success' | 'error';
  message: string;
}) {
  const { theme } = useTheme();
  const isSuccess = type === 'success';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 10,
        marginBottom: 16,
        backgroundColor: isSuccess ? 'rgba(23,209,198,0.12)' : theme.dangerSoft,
        borderWidth: 1,
        borderColor: isSuccess ? '#17D1C6' : theme.danger,
      }}
    >
      <FontAwesome
        name={isSuccess ? 'check-circle' : 'exclamation-circle'}
        size={14}
        color={isSuccess ? '#17D1C6' : theme.danger}
      />
      <Text
        style={{
          color: isSuccess ? '#17D1C6' : theme.danger,
          fontSize: 13,
          flex: 1,
        }}
      >
        {message}
      </Text>
    </View>
  );
}

// ─── TableHeader ────────────────────────────────────────────
/**
 * Table header row (uppercase labels with C tokens)
 */
export function TableHeader({
  columns,
}: {
  columns: { label: string; flex: number }[];
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.liftBg,
      }}
    >
      {columns.map((col, i) => (
        <Text
          key={i}
          style={{
            flex: col.flex,
            color: theme.textMuted,
            fontSize: 9,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            textAlign: i === columns.length - 1 ? 'right' : 'left',
          }}
        >
          {col.label}
        </Text>
      ))}
    </View>
  );
}

// ─── TableRow ───────────────────────────────────────────────
/**
 * Generic table row component
 */
export function TableRow({
  cells,
  onPress,
  isLast = false,
}: {
  cells: { flex: number; content: ReactNode }[];
  onPress?: () => void;
  isLast?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.border,
      }}
    >
      {cells.map((cell, i) => (
        <View key={i} style={{ flex: cell.flex }}>
          {cell.content}
        </View>
      ))}
    </TouchableOpacity>
  );
}

// ─── ConfirmModal ────────────────────────────────────────────
/**
 * Confirmation dialog (delete, confirm action, etc)
 */
export function ConfirmModal({
  visible,
  title,
  message,
  icon = 'exclamation-circle',
  iconColor,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
}: {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const { theme } = useTheme();
  const effectiveIconColor = iconColor ?? theme.danger;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(5,5,12,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: theme.cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 28,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              backgroundColor: `${effectiveIconColor}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <FontAwesome name={icon as any} size={20} color={effectiveIconColor} />
          </View>
          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: '800',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 24,
            }}
          >
            {message}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SecondaryButton
              label={cancelLabel}
              onPress={onCancel}
              disabled={loading}
            />
            <PrimaryButton
              label={confirmLabel}
              onPress={onConfirm}
              disabled={loading}
              style={{
                backgroundColor: effectiveIconColor,
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
