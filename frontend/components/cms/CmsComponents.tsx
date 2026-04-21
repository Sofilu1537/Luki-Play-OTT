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
import { C } from './CmsShell';

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
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 140,
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: C.border,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: `${color}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FontAwesome name={icon as any} size={18} color={color} />
      </View>
      <View>
        <Text
          style={{
            color: C.muted,
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: C.text,
            fontSize: 22,
            fontWeight: '800',
            marginTop: 2,
          }}
        >
          {value}
        </Text>
      </View>
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
        backgroundColor: disabled ? C.muted : C.accent,
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
        borderColor: C.border,
        backgroundColor: 'transparent',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {icon && (
        <FontAwesome name={icon as any} size={12} color={C.textDim} />
      )}
      <Text
        style={{
          color: C.textDim,
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
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          color: C.muted,
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        {label} {required && <Text style={{ color: C.danger }}>*</Text>}
      </Text>
      {children}
      {hint && (
        <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
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
  const webInput =
    Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  return (
    <TextInput
      style={{
        backgroundColor: C.lift,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: C.text,
        fontSize: 13,
        fontFamily: monospace && Platform.OS === 'web' ? 'monospace' : undefined,
        minHeight: multiline ? 100 : 'auto',
        ...webInput,
      }}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.muted}
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
  color = C.accent,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? color : C.border,
        backgroundColor: selected ? `${color}20` : C.lift,
      }}
    >
      <Text
        style={{
          color: selected ? color : C.textDim,
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
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
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
          backgroundColor: C.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FontAwesome name={icon as any} size={26} color={C.accent} />
      </View>
      <Text
        style={{
          color: C.text,
          fontSize: 15,
          fontWeight: '800',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: C.muted,
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
        backgroundColor: isSuccess ? 'rgba(23,209,198,0.12)' : C.roseSoft,
        borderWidth: 1,
        borderColor: isSuccess ? '#17D1C6' : C.danger,
      }}
    >
      <FontAwesome
        name={isSuccess ? 'check-circle' : 'exclamation-circle'}
        size={14}
        color={isSuccess ? '#17D1C6' : C.danger}
      />
      <Text
        style={{
          color: isSuccess ? '#17D1C6' : C.danger,
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
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.lift,
      }}
    >
      {columns.map((col, i) => (
        <Text
          key={i}
          style={{
            flex: col.flex,
            color: C.muted,
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
        borderBottomColor: C.border,
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
  iconColor = C.danger,
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
            backgroundColor: C.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.border,
            padding: 28,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              backgroundColor: `${iconColor}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <FontAwesome name={icon as any} size={20} color={iconColor} />
          </View>
          <Text
            style={{
              color: C.text,
              fontSize: 16,
              fontWeight: '800',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: C.muted,
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
                backgroundColor: iconColor,
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
