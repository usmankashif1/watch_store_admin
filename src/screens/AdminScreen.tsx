import { AdminHeader, AdminSidebar, type AdminPage } from "@/src/navigation/AdminNavigation";
import { COLORS, DESKTOP } from "@/src/components/admin/adminTheme";
import { DashboardView, EntityGrid, ProductTable } from "@/src/components/admin/CatalogViews";
import { EntityModal } from "@/src/components/admin/EntityModal";
import { ProductModal } from "@/src/components/admin/ProductModal";
import {
    deleteBrand,
    deleteCategory,
    deleteCollection,
    deleteProduct,
    getProductCollections,
    listBrands,
    listCategories,
    listCollections,
    listProducts,
    loadDashboard,
} from "@/src/services/admin";
import type {
    Brand,
    Category,
    Collection,
    Product,
    ProductInput,
} from "@/src/types/database";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Page = AdminPage;
type Entity = Brand | Category | Collection;

const emptyProduct = (): ProductInput => ({
  id: "",
  brand: "",
  name: "",
  short_name: "",
  price: null,
  image_url: "",
  product_images: [],
  strap: "",
  color: "",
  warranty: "",
  description: "",
  details: {},
  specs: {},
  brand_id: null,
  category_id: null,
  collectionIds: [],
});
export default function AdminScreen() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [dashboard, setDashboard] = useState<{
    products: number;
    brands: number;
    categories: number;
    collections: number;
    recent: Product[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [productForm, setProductForm] = useState<ProductInput | null>(null);
  const [entityForm, setEntityForm] = useState<{
    kind: "brand" | "category" | "collection";
    value?: Entity;
  } | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [
        nextProducts,
        nextBrands,
        nextCategories,
        nextCollections,
        nextDashboard,
      ] = await Promise.all([
        listProducts(),
        listBrands(),
        listCategories(),
        listCollections(),
        loadDashboard(),
      ]);
      setProducts(nextProducts);
      setBrands(nextBrands);
      setCategories(nextCategories);
      setCollections(nextCollections);
      setDashboard(nextDashboard);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not connect to Supabase.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        [product.name, product.short_name, product.brand, product.color].some(
          (value) => value?.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [products, search],
  );
  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  };
  const remove = async (label: string, action: () => Promise<void>) => {
    if (
      Platform.OS === "web" ? window.confirm(`Delete this ${label}?`) : true
    ) {
      try {
        await action();
        await refresh();
        showNotice(`${label} deleted`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Delete failed.");
      }
    }
  };

  return (
    <View style={styles.app}>
      <AdminSidebar page={page} onChange={setPage} />
      <ScrollView
        style={styles.main}
        contentContainerStyle={styles.mainContent}
      >
        <AdminHeader page={page} onRefresh={refresh} />
        {notice ? (
          <View style={styles.notice}>
            <MaterialIcons
              name="check-circle"
              size={18}
              color={COLORS.accent}
            />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => setError("")}>
              <MaterialIcons name="close" size={18} color={COLORS.danger} />
            </Pressable>
          </View>
        ) : null}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.accent} size="large" />
            <Text style={styles.muted}>Loading catalog...</Text>
          </View>
        ) : page === "Dashboard" ? (
          <DashboardView data={dashboard} onProducts={() => setPage("Products")} />
        ) : page === "Products" ? (
          <ProductTable
            products={filteredProducts}
            search={search}
            setSearch={setSearch}
            onAdd={() => setProductForm(emptyProduct())}
            onEdit={async (product) =>
              setProductForm({
                ...product,
                collectionIds: await getProductCollections(product.id),
              })
            }
            onDelete={(id) => remove("product", () => deleteProduct(id))}
            brands={brands}
            categories={categories}
          />
        ) : (
          <EntityGrid
            kind={page.toLowerCase() as "brands" | "categories" | "collections"}
            items={
              page === "Brands"
                ? brands
                : page === "Categories"
                  ? categories
                  : collections
            }
            onAdd={() =>
              setEntityForm({
                kind:
                  page === "Brands"
                    ? "brand"
                    : page === "Categories"
                      ? "category"
                      : "collection",
              })
            }
            onEdit={(value) =>
              setEntityForm({
                kind:
                  page === "Brands"
                    ? "brand"
                    : page === "Categories"
                      ? "category"
                      : "collection",
                value,
              })
            }
            onDelete={(id) =>
              remove(
                page.slice(0, -1).toLowerCase(),
                page === "Brands"
                  ? () => deleteBrand(id)
                  : page === "Categories"
                    ? () => deleteCategory(id)
                    : () => deleteCollection(id),
              )
            }
          />
        )}
      </ScrollView>
      {productForm ? (
        <ProductModal
          value={productForm}
          brands={brands}
          categories={categories}
          collections={collections}
          onClose={() => setProductForm(null)}
          onSaved={async () => {
            setProductForm(null);
            await refresh();
            showNotice("Product saved");
          }}
          setError={setError}
        />
      ) : null}
      {entityForm ? (
        <EntityModal
          form={entityForm}
          onClose={() => setEntityForm(null)}
          onSaved={async () => {
            setEntityForm(null);
            await refresh();
            showNotice("Saved successfully");
          }}
          setError={setError}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, flexDirection: "row", backgroundColor: COLORS.canvas },
  main: { flex: 1 },
  mainContent: { padding: DESKTOP.pagePadding, maxWidth: DESKTOP.contentMaxWidth, width: "100%", alignSelf: "center" },
  notice: { backgroundColor: COLORS.accentSoft, borderRadius: 6, padding: 14, flexDirection: "row", gap: 9, marginBottom: 20 },
  noticeText: { color: COLORS.accent, fontSize: 14 },
  error: { backgroundColor: "#fff0ef", borderRadius: 6, padding: 14, flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  errorText: { color: COLORS.danger, fontSize: 14, flex: 1 },
  center: { alignItems: "center", paddingTop: 110, gap: 12 },
  muted: { color: COLORS.muted, fontSize: 14 },
});