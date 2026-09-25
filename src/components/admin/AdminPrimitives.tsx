import type { KeyValue } from '@/src/types/database';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from './adminTheme';

export function Field({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: any }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#a3a59f" keyboardType={keyboardType} style={styles.input} /></View>;
}

export function TextArea({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} multiline numberOfLines={4} textAlignVertical="top" style={[styles.input, styles.textarea]} /></View>;
}

export function Select({ label, value, options, onChange }: { label: string; value: number | null; options: { id: number; name: string }[]; onChange: (value: number | null) => void }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.chips}>{options.map((option) => <Pressable key={option.id} onPress={() => onChange(value === option.id ? null : option.id)} style={[styles.chip, value === option.id && styles.chipActive]}><Text style={[styles.chipText, value === option.id && styles.chipTextActive]}>{option.name}</Text></Pressable>)}</View></View>;
}

export function Repeatable({ label, rows, setRows }: { label: string; rows: KeyValue[]; setRows: (rows: KeyValue[]) => void }) {
  return <View style={styles.formSection}><View style={styles.repeatHeader}><Text style={styles.formSectionTitle}>{label}</Text><Pressable onPress={() => setRows([...rows, { label: '', value: '' }])}><Text style={styles.addRow}>+ Add row</Text></Pressable></View>{rows.map((row, index) => <View style={styles.repeatRow} key={`${label}-${index}`}><TextInput value={row.label} onChangeText={(value) => setRows(rows.map((current, rowIndex) => rowIndex === index ? { ...current, label: value } : current))} placeholder="Label" placeholderTextColor="#a3a59f" style={styles.input} /><TextInput value={row.value} onChangeText={(value) => setRows(rows.map((current, rowIndex) => rowIndex === index ? { ...current, value } : current))} placeholder="Value" placeholderTextColor="#a3a59f" style={styles.input} /><IconButton icon="remove-circle-outline" danger onPress={() => setRows(rows.filter((_, rowIndex) => rowIndex !== index))} /></View>)}</View>;
}

export function PrimaryButton({ label, icon, onPress, disabled }: { label: string; icon: any; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.primary, disabled && styles.disabled]}><MaterialIcons name={icon} size={18} color="#fff" /><Text style={styles.primaryText}>{label}</Text></Pressable>;
}

export function IconButton({ icon, onPress, danger }: { icon: any; onPress: () => void; danger?: boolean }) {
  return <Pressable onPress={onPress} style={styles.iconButton}><MaterialIcons name={icon} size={20} color={danger ? COLORS.danger : COLORS.muted} /></Pressable>;
}

export function Empty({ text }: { text: string }) {
  return <View style={styles.empty}><MaterialIcons name="inventory-2" size={28} color="#b0b4ad" /><Text style={styles.muted}>{text}</Text></View>;
}

export function InlineCreateHint({ text }: { text: string }) { return <Text style={styles.hint}>{text}</Text>; }

const styles = StyleSheet.create({
  field: { marginBottom: 14, minWidth: 240, flex: 1 },
  fieldLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 6, color: COLORS.ink, paddingHorizontal: 11, paddingVertical: 10, fontSize: 14, minHeight: 42 },
  textarea: { minHeight: 88 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 11 },
  chip: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9 },
  chipActive: { backgroundColor: COLORS.accentSoft, borderColor: '#a7c5b5' },
  chipText: { color: COLORS.muted, fontSize: 13 },
  chipTextActive: { color: COLORS.accent, fontWeight: '600' },
  formSection: { marginTop: 10, marginBottom: 18 },
  formSectionTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '600', marginBottom: 11 },
  repeatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  repeatRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 },
  addRow: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.accent, borderRadius: 6, paddingHorizontal: 15, paddingVertical: 10 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.55 },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  empty: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  muted: { color: COLORS.muted, fontSize: 14 },
  hint: { fontSize: 12, color: COLORS.muted, marginTop: -8, marginBottom: 18 },
});
