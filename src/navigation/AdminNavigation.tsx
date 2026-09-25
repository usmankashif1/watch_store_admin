import { COLORS } from '@/src/components/admin/adminTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AdminPage = 'Dashboard' | 'Products' | 'Brands' | 'Categories' | 'Collections';

const icons: Record<AdminPage, keyof typeof MaterialIcons.glyphMap> = {
    Dashboard: 'space-dashboard',
    Products: 'watch',
    Brands: 'business',
    Categories: 'category',
    Collections: 'collections',
};

export function AdminSidebar({ page, onChange }: { page: AdminPage; onChange: (page: AdminPage) => void }) {
    const pages: AdminPage[] = ['Dashboard', 'Products', 'Brands', 'Categories', 'Collections'];
    return <View style={styles.sidebar}><View><View style={styles.brandMark}><View style={styles.markDot} /><Text style={styles.brandTitle}>Watch Store</Text></View><Text style={styles.sideEyebrow}>STORE ADMIN</Text><View style={styles.nav}>{pages.map((item) => <Pressable key={item} onPress={() => onChange(item)} style={[styles.navItem, page === item && styles.navActive]}><MaterialIcons name={icons[item]} size={21} color={page === item ? COLORS.accent : COLORS.muted} /><Text style={[styles.navText, page === item && styles.navTextActive]}>{item}</Text></Pressable>)}</View></View><View style={styles.sideFooter}><Text style={styles.sideFooterText}>Catalog workspace</Text><Text style={styles.sideFooterSub}>Connected to Supabase</Text></View></View>;
}

export function AdminHeader({ page, onRefresh }: { page: AdminPage; onRefresh: () => void }) {
    return <View style={styles.topbar}><View><Text style={styles.kicker}>CATALOG / {page.toUpperCase()}</Text><Text style={styles.heading}>{page}</Text></View><Pressable style={styles.refreshButton} onPress={onRefresh}><MaterialIcons name="refresh" size={20} color={COLORS.ink} /><Text style={styles.refreshText}>Refresh</Text></Pressable></View>;
}

const styles = StyleSheet.create({
    sidebar: { width: 248, backgroundColor: '#fbfcfa', borderRightWidth: 1, borderRightColor: COLORS.line, padding: 26, justifyContent: 'space-between' },
    brandMark: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 }, markDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.accent }, brandTitle: { fontWeight: '700', letterSpacing: 2, fontSize: 15, color: COLORS.ink }, sideEyebrow: { fontSize: 10, color: COLORS.muted, letterSpacing: 1.5, marginBottom: 25 }, nav: { gap: 5 }, navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 7 }, navActive: { backgroundColor: COLORS.accentSoft }, navText: { fontSize: 14, color: COLORS.muted }, navTextActive: { color: COLORS.accent, fontWeight: '600' }, sideFooter: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 17 }, sideFooterText: { fontSize: 12, color: COLORS.ink }, sideFooterSub: { fontSize: 11, color: COLORS.muted, marginTop: 5 }, topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }, kicker: { fontSize: 10, color: COLORS.muted, letterSpacing: 1.6, marginBottom: 7 }, heading: { fontSize: 32, fontWeight: '700', color: COLORS.ink }, refreshButton: { borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.paper }, refreshText: { fontSize: 13, color: COLORS.ink },
});
