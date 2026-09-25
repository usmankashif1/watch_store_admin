import { jsonRows, rowsJson, saveProduct, uploadImages } from '@/src/services/admin';
import type { Brand, Category, Collection, KeyValue, ProductInput } from '@/src/types/database';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Field, IconButton, InlineCreateHint, PrimaryButton, Repeatable, Select, TextArea } from './AdminPrimitives';
import { modalStyles as styles } from './adminModalStyles';
import { COLORS } from './adminTheme';

const defaultSpecLabels = ['Brand', 'Strap', 'Color', 'Warranty'];
function productSpecRows(value: ProductInput): KeyValue[] {
  const existing = jsonRows(value.specs);
  const getValue = (label: string) => existing.find((row) => row.label.trim().toLowerCase() === label.toLowerCase())?.value;
  const defaults = defaultSpecLabels.map((label) => ({ label, value: getValue(label) ?? (label === 'Brand' ? value.brand : label === 'Strap' ? value.strap : label === 'Color' ? value.color : value.warranty) ?? '' }));
  const customRows = existing.filter((row) => !defaultSpecLabels.some((label) => label.toLowerCase() === row.label.trim().toLowerCase()));
  return [...defaults, ...customRows];
}
export function ProductModal({
  value,
  brands,
  categories,
  collections,
  onClose,
  onSaved,
  setError,
}: {
  value: ProductInput;
  brands: Brand[];
  categories: Category[];
  collections: Collection[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  setError: (value: string) => void;
}) {
  const [form, setForm] = useState(value);
  const [specs, setSpecs] = useState<KeyValue[]>(productSpecRows(value));
  const [details, setDetails] = useState<KeyValue[]>(jsonRows(value.details));
  const specsWereArray = Array.isArray(value.specs);
  const detailsWereArray = Array.isArray(value.details);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingMode, setUploadingMode] = useState<"main" | "additional" | null>(null);
  const update = (key: keyof ProductInput, next: any) =>
    setForm((current) => ({ ...current, [key]: next }));
  const updateSpecValue = (label: string, valueToSet: string) =>
    setSpecs((current) =>
      current.map((row) =>
        row.label.toLowerCase() === label.toLowerCase()
          ? { ...row, value: valueToSet }
          : row,
      ),
    );
  const pickImage = async (mode: "main" | "additional") => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: mode === "additional", quality: 1 });
      if (result.canceled) return;
      setUploading(true);
      setUploadingMode(mode);
      try {
        const urls = await uploadImages(result.assets.map((asset) => ({ uri: asset.uri, name: asset.fileName ?? `watch-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' })), { kind: 'product' });
        if (mode === "main") update("image_url", urls[0]);
        else {
          const firstImage = form.image_url || urls.length === 0 ? null : urls[0];
          const additionalImages = firstImage ? urls.slice(1) : urls;
          if (firstImage) update("image_url", firstImage);
          if (additionalImages.length) update("product_images", [...(form.product_images ?? []), ...additionalImages]);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Upload failed.");
      } finally {
        setUploading(false);
        setUploadingMode(null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open image picker.");
    }
  };
  const save = async () => {
    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }
    const specValue = (label: string) =>
      specs.find((row) => row.label.toLowerCase() === label.toLowerCase())
        ?.value ?? "";
    const specBrand = specValue("Brand");
    const matchingBrand = brands.find(
      (brand) => brand.name.trim().toLowerCase() === specBrand.trim().toLowerCase(),
    );
    setSaving(true);
    try {
      await saveProduct(
        {
          ...form,
          brand: specBrand,
          brand_id: matchingBrand?.id ?? null,
          strap: specValue("Strap"),
          color: specValue("Color"),
          warranty: specValue("Warranty"),
          specs: rowsJson(specs, specsWereArray),
          details: rowsJson(details, detailsWereArray),
          price: form.price === null ? null : Number(form.price),
        },
        value.id ? value.id : undefined,
      );
      await onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save product.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={styles.modal}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.kicker}>CATALOG / PRODUCTS</Text>
            <Text style={styles.modalTitle}>
              {value.id ? "Edit product" : "Add product"}
            </Text>
          </View>
          <IconButton icon="close" onPress={onClose} />
        </View>
        <View style={styles.formGrid}>
          <Field
            label="Name"
            value={form.name}
            onChangeText={(v) => update("name", v)}
          />
          <Field
            label="Short name"
            value={form.short_name ?? ""}
            onChangeText={(v) => update("short_name", v)}
          />
          <Field
            label="Price"
            value={form.price == null ? "" : String(form.price)}
            onChangeText={(v) => update("price", v ? Number(v) : null)}
            keyboardType="decimal-pad"
          />
        </View>
        <Select
          label="Category relationship"
          value={form.category_id}
          options={categories}
          onChange={(v) => update("category_id", v)}
        />
        <InlineCreateHint text="Create categories from the Categories page." />
        <TextArea
          label="Description"
          value={form.description ?? ""}
          onChangeText={(v) => update("description", v)}
        />
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Specifications</Text>
          <Select
            label="Brand relationship"
            value={form.brand_id}
            options={brands}
            onChange={(v) => {
              update("brand_id", v);
              updateSpecValue(
                "Brand",
                brands.find((brand) => brand.id === v)?.name ?? "",
              );
            }}
          />
          <InlineCreateHint text="Brand, Strap, Color, and Warranty are editable below. Add any additional specifications as needed." />
          <Repeatable label="Specifications" rows={specs} setRows={setSpecs} />
        </View>
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Images</Text>
          <View style={styles.uploadRow}>
            <Pressable
              style={[
                styles.uploadBox,
                form.image_url && styles.uploadBoxFilled,
              ]}
              onPress={() => pickImage("main")}
            >
              {uploading && uploadingMode === "main" ? (
                <ActivityIndicator size="large" color={COLORS.accent} />
              ) : form.image_url ? (
                <Image
                  source={{ uri: form.image_url }}
                  style={styles.preview}
                />
              ) : (
                <MaterialIcons
                  name="add-photo-alternate"
                  size={25}
                  color={COLORS.accent}
                />
              )}
              <Text style={styles.uploadLabel}>{uploading && uploadingMode === "main" ? "Uploading..." : "Main image"}</Text>
              {form.image_url ? (
                <Pressable
                  style={styles.removeImage}
                  onPress={(event) => {
                    event.stopPropagation();
                    update("image_url", "");
                  }}
                >
                  <MaterialIcons name="close" size={13} color="#fff" />
                </Pressable>
              ) : null}
            </Pressable>
            <Pressable
              style={styles.uploadBox}
              onPress={() => pickImage("additional")}
            >
              {uploading && uploadingMode === "additional" ? <ActivityIndicator size="large" color={COLORS.accent} /> : <MaterialIcons name="collections" size={25} color={COLORS.accent} />}
              <Text style={styles.uploadLabel}>{uploading && uploadingMode === "additional" ? "Uploading..." : "Add images"}</Text>
            </Pressable>
          </View>
          <View style={styles.imageStrip}>
            {(form.product_images ?? []).map((url) => (
              <View key={url} style={styles.previewWrap}>
                <Image source={{ uri: url }} style={styles.previewSmall} />
                <Pressable
                  style={styles.removeImage}
                  onPress={() =>
                    update(
                      "product_images",
                      (form.product_images ?? []).filter(
                        (current) => current !== url,
                      ),
                    )
                  }
                >
                  <MaterialIcons name="close" size={13} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
        <Repeatable label="Details" rows={details} setRows={setDetails} />
        <Text style={styles.formSectionTitle}>Collections</Text>
        <View style={styles.chips}>
          {collections.map((collection) => {
            const active = form.collectionIds.includes(collection.id);
            return (
              <Pressable
                key={collection.id}
                onPress={() =>
                  update(
                    "collectionIds",
                    active
                      ? form.collectionIds.filter((id) => id !== collection.id)
                      : [...form.collectionIds, collection.id],
                  )
                }
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {collection.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.modalFooter}>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <PrimaryButton
            label={saving ? "Saving..." : "Save product"}
            icon="check"
            onPress={save}
            disabled={saving || uploading}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

