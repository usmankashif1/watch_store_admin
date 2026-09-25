import { saveBrand, saveCategory, saveCollection, uploadImage } from '@/src/services/admin';
import type { Brand, Category, Collection } from '@/src/types/database';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Field, IconButton, PrimaryButton, TextArea } from './AdminPrimitives';
import { modalStyles as styles } from './adminModalStyles';
import { COLORS } from './adminTheme';

type Entity = Brand | Category | Collection;
export function EntityModal({
  form,
  onClose,
  onSaved,
  setError,
}: {
  form: { kind: "brand" | "category" | "collection"; value?: Entity };
  onClose: () => void;
  onSaved: () => Promise<void>;
  setError: (value: string) => void;
}) {
  const value = form.value;
  const [name, setName] = useState(value?.name ?? "");
  const [description, setDescription] = useState(
    value && "description" in value ? (value.description ?? "") : "",
  );
  const [url, setUrl] = useState(
    form.kind === "brand" && value && "logo_url" in value
      ? (value.logo_url ?? "")
      : form.kind === "category" && value && "image" in value
        ? (value.image ?? "")
        : "",
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const chooseImage = () => {
    const choose = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
      if (result.canceled) return;
      const asset = result.assets[0];
      setUploading(true);
      try {
        setUrl(
          await uploadImage({
            uri: asset.uri,
            name: asset.fileName ?? `image-${Date.now()}.png`,
            type: asset.mimeType ?? 'image/png',
          }, { kind: form.kind === 'category' ? 'category' : 'brand' }),
        );
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    };
    choose().catch((cause) => setError(cause instanceof Error ? cause.message : "Could not open image picker."));
  };
  const save = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      if (form.kind === "brand")
        await saveBrand({ name, logo_url: url || null }, value?.id);
      else if (form.kind === "category")
        await saveCategory(
          { name, description: description || null, image: url || null },
          value?.id,
        );
      else
        await saveCollection(
          { name, description: description || null },
          value?.id,
        );
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.entityModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {value ? "Edit" : "Add"} {form.kind}
            </Text>
            <IconButton icon="close" onPress={onClose} />
          </View>
          <Field label="Name" value={name} onChangeText={setName} />
          {form.kind === "collection" ? (
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
            />
          ) : (
            <>
              <Field
                label={form.kind === "brand" ? "Logo URL" : "Image URL"}
                value={url}
                onChangeText={setUrl}
              />
              <Pressable style={styles.uploadLink} onPress={chooseImage}>
                <MaterialIcons name="upload" size={16} color={COLORS.accent} />
                <Text style={styles.addRow}>
                  {uploading
                    ? "Uploading..."
                    : `Upload ${form.kind === "brand" ? "logo" : "image"}`}
                </Text>
              </Pressable>
              {form.kind === "category" ? (
                <TextArea
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                />
              ) : null}
            </>
          )}
          <View style={styles.modalFooter}>
            <Pressable onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <PrimaryButton
              label={saving ? "Saving..." : "Save"}
              icon="check"
              onPress={save}
              disabled={saving || uploading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

