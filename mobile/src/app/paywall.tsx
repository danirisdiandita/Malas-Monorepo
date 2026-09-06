import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { YuzuButton, YuzuHeader, YuzuScreen, yuzuColors, yuzuText } from '@/components/yuzu-screen';

const benefits = ['Unlimited recipe imports', 'Smart grocery lists', 'Flexible meal planning', 'Pantry tracking'];

export default function PaywallScreen() {
  return <YuzuScreen><YuzuHeader title="" onBack={() => router.back()} /><View style={styles.hero}><ThemedText style={styles.eyebrow}>YUZU PRO</ThemedText><ThemedText style={styles.title}>Your best cooking starts here.</ThemedText><ThemedText style={yuzuText.body}>Save more. Plan better. Shop smarter.</ThemedText></View><View style={styles.benefits}>{benefits.map((benefit) => <View key={benefit} style={styles.benefit}><Ionicons name="checkmark-circle" size={18} color={yuzuColors.sun} /><ThemedText style={styles.benefitText}>{benefit}</ThemedText></View>)}</View><View style={styles.plans}><Plan title="Yearly plan · Best value" price="$60 / year" /><Plan title="Monthly plan" price="$15 / month" /><Plan title="Weekly plan" price="$8 / week" /></View><YuzuButton onPress={() => router.back()}>Start 7-day free trial</YuzuButton><ThemedText style={styles.note}>Try yuzu Pro free for one week. Cancel anytime.</ThemedText></YuzuScreen>;
}

function Plan({ title, price }: { title: string; price: string }) { return <View style={styles.plan}><ThemedText style={styles.planTitle}>{title}</ThemedText><ThemedText style={styles.price}>{price}</ThemedText></View>; }

const styles = StyleSheet.create({ hero: { alignItems: 'center', backgroundColor: yuzuColors.ink, borderRadius: 20, padding: 22, gap: 8 }, eyebrow: { color: yuzuColors.sun, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#fff', fontSize: 28, lineHeight: 31, fontWeight: '800', textAlign: 'center' }, benefits: { backgroundColor: '#274333', borderRadius: 16, padding: 14, gap: 10, marginTop: -20 }, benefit: { flexDirection: 'row', alignItems: 'center', gap: 9 }, benefitText: { color: '#fff', fontSize: 13, fontWeight: '700' }, plans: { gap: 9 }, plan: { minHeight: 50, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: yuzuColors.line, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, planTitle: { color: yuzuColors.ink, fontSize: 12, fontWeight: '700' }, price: { color: yuzuColors.leaf, fontSize: 12, fontWeight: '900' }, note: { color: yuzuColors.muted, fontSize: 10, textAlign: 'center' } });
