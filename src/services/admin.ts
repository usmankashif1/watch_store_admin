import type { Brand, Category, Collection, Json, Product, ProductInput } from '@/src/types/database';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

const unwrap = <T,>(result: { data: T | null; error: { message: string } | null }): T => {
    if (result.error) throw new Error(result.error.message);
    return result.data as T;
};

export async function loadDashboard() {
    const [products, brands, categories, collections, recent] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('brands').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('collections').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id, name, brand, price, image_url, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    for (const result of [products, brands, categories, collections, recent]) if (result.error) throw new Error(result.error.message);
    return { products: products.count ?? 0, brands: brands.count ?? 0, categories: categories.count ?? 0, collections: collections.count ?? 0, recent: (recent.data ?? []) as Product[] };
}

export async function listProducts() {
    return unwrap(await supabase.from('products').select('*').order('created_at', { ascending: false })) as Product[];
}
export async function listBrands() { return unwrap(await supabase.from('brands').select('*').order('name')) as Brand[]; }
export async function listCategories() { return unwrap(await supabase.from('categories').select('*').order('name')) as Category[]; }
export async function listCollections() { return unwrap(await supabase.from('collections').select('*').order('name')) as Collection[]; }
export async function getProductCollections(productId: string) {
    const rows = unwrap(await supabase.from('product_collections').select('collection_id').eq('product_id', productId)) as { collection_id: number }[];
    return rows.map((row) => row.collection_id);
}

export async function saveProduct(product: ProductInput, editingId?: string) {
    const { collectionIds, ...values } = product;
    const productValues = editingId ? values : { ...values, id: await createProductId(values.name) };
    const saved = editingId
        ? unwrap<Product>(await supabase.from('products').update(productValues).eq('id', editingId).select().single())
        : unwrap<Product>(await supabase.from('products').insert(productValues).select().single());
    const productId = saved.id;
    unwrap(await supabase.from('product_collections').delete().eq('product_id', productId));
    if (collectionIds.length) unwrap(await supabase.from('product_collections').insert(collectionIds.map((collection_id) => ({ product_id: productId, collection_id }))));
    return saved;
}
export async function deleteProduct(id: string) { unwrap(await supabase.from('product_collections').delete().eq('product_id', id)); unwrap(await supabase.from('products').delete().eq('id', id)); }

export async function saveBrand(values: Pick<Brand, 'name' | 'logo_url'>, id?: number) { return id ? unwrap(await supabase.from('brands').update(values).eq('id', id).select().single()) : unwrap(await supabase.from('brands').insert(values).select().single()); }
export async function deleteBrand(id: number) { unwrap(await supabase.from('brands').delete().eq('id', id)); }
export async function saveCategory(values: Pick<Category, 'name' | 'description' | 'image'>, id?: number) { return id ? unwrap(await supabase.from('categories').update(values).eq('id', id).select().single()) : unwrap(await supabase.from('categories').insert(values).select().single()); }
export async function deleteCategory(id: number) { unwrap(await supabase.from('categories').delete().eq('id', id)); }
export async function saveCollection(values: Pick<Collection, 'name' | 'description'>, id?: number) { return id ? unwrap(await supabase.from('collections').update(values).eq('id', id).select().single()) : unwrap(await supabase.from('collections').insert(values).select().single()); }
export async function deleteCollection(id: number) { unwrap(await supabase.from('collections').delete().eq('id', id)); }

type ImageUploadOptions = { kind?: 'product' | 'category' | 'brand' };

export async function uploadImage(file: { uri: string; name: string; type?: string }, options: ImageUploadOptions = {}) {
    const files = await uploadImages([file], options);
    return files[0];
}

export async function uploadImages(files: { uri: string; name: string; type?: string }[], options: ImageUploadOptions = {}) {
    if (!files.length) return [];
    const urls: string[] = [];
    const storage = supabase.storage.from('watch-images');
    const pageSize = 1000;
    const existingNames: string[] = [];
    for (let offset = 0; ; offset += pageSize) {
        const listed = await storage.list('', { limit: pageSize, offset });
        if (listed.error) throw new Error(`Could not inspect existing watch images: ${listed.error.message}`);
        existingNames.push(...listed.data.map((file) => file.name));
        if (listed.data.length < pageSize) break;
    }
    const usedNumbers = new Set(existingNames.flatMap((name) => {
        const match = /^watch_(\d+)(?:\.[^.]+)?$/i.exec(name);
        return match ? [Number(match[1])] : [];
    }));
    let nextNumber = 1;

    for (const file of files) {
        const type = file.type?.toLowerCase() ?? '';
        if (!type.startsWith('image/')) throw new Error(`"${file.name}" is not an image file.`);
        const normalized = await normalizeImage(file, options.kind ?? 'product');
        const body = normalized.body;
        if (!body.size) throw new Error(`"${file.name}" is empty.`);
        if (body.size > 10 * 1024 * 1024) throw new Error(`"${file.name}" is larger than 10 MB.`);
        while (usedNumbers.has(nextNumber)) nextNumber += 1;
        const extension = '.png';
        let upload: Awaited<ReturnType<typeof storage.upload>> | null = null;
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const path = `watch_${nextNumber}${extension}`;
            upload = await storage.upload(path, body, { contentType: normalized.type, upsert: false, cacheControl: '3600' });
            if (!upload.error) break;
            const message = upload.error.message.toLowerCase();
            const status = Number((upload.error as { statusCode?: string | number }).statusCode);
            if (status === 409 || message.includes('already exists') || message.includes('duplicate')) {
                usedNumbers.add(nextNumber);
                nextNumber += 1;
                continue;
            }
            const errorName = (upload.error as { name?: string }).name;
            throw new Error(`Could not upload "${file.name}" to watch-images: ${upload.error.message}${errorName ? ` [${errorName}]` : ''}${status ? ` (status ${status})` : ''}`);
        }
        if (!upload || upload.error) {
            const detail = upload?.error?.message ?? 'Storage did not return an upload response.';
            throw new Error(`Could not find an available watch image filename for "${file.name}": ${detail}`);
        }
        usedNumbers.add(nextNumber);
        nextNumber += 1;
        const publicUrl = storage.getPublicUrl(upload.data.path).data.publicUrl;
        if (!publicUrl) throw new Error(`Storage uploaded "${file.name}" but returned no public URL.`);
        urls.push(publicUrl);
    }
    return urls;
}

async function normalizeImage(file: { uri: string; name: string; type?: string }, kind: 'product' | 'category' | 'brand') {
    const source = await ImageManipulator.manipulateAsync(file.uri, [], { format: ImageManipulator.SaveFormat.PNG, compress: 1 });
    if (!source.width || !source.height) throw new Error(`Could not read the dimensions of "${file.name}".`);
    const target = kind === 'product' ? { width: 1080, height: 1440 } : { width: 360, height: 480 };
    const result = await ImageManipulator.manipulateAsync(
        source.uri,
        [{ crop: cropToAspect(source.width, source.height, 3 / 4) }, { resize: target }],
        { format: ImageManipulator.SaveFormat.PNG, compress: 1 },
    );
    const response = await fetch(result.uri);
    if (!response.ok) throw new Error(`Could not prepare "${file.name}" for upload.`);
    const body = await response.blob();
    return { body, type: 'image/png' };
}

export function jsonRows(value: Json): { label: string; value: string }[] {
    if (!value || typeof value !== 'object') return [];
    if (Array.isArray(value)) {
        return value.flatMap((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
            const row = item as { label?: Json; value?: Json };
            return [{ label: String(row.label ?? ''), value: String(row.value ?? '') }];
        });
    }
    return Object.entries(value).map(([label, current]) => ({ label, value: String(current ?? '') }));
}
export function rowsJson(rows: { label: string; value: string }[], asArray = false): Json {
    const validRows = rows.filter((row) => row.label.trim()).map((row) => ({ label: row.label.trim(), value: row.value }));
    return asArray ? validRows : Object.fromEntries(validRows.map((row) => [row.label, row.value]));
}

async function createProductId(name: string) {
    const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'watch';
    const prefix = `watch-${base}`;
    const existing = unwrap(await supabase.from('products').select('id').like('id', `${prefix}%`)) as { id: string }[];
    const used = new Set(existing.map((product) => product.id));
    let candidate = prefix;
    let suffix = 1;
    while (used.has(candidate)) {
        suffix += 1;
        candidate = `${prefix}-${suffix}`;
    }
    return candidate;
}

function cropToAspect(width: number, height: number, aspect: number) {
    const currentAspect = width / height;
    if (currentAspect > aspect) {
        const cropWidth = Math.floor(height * aspect);
        return { originX: Math.floor((width - cropWidth) / 2), originY: 0, width: cropWidth, height };
    }
    const cropHeight = Math.floor(width / aspect);
    return { originX: 0, originY: Math.floor((height - cropHeight) / 2), width, height: cropHeight };
}