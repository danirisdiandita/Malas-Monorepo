import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useCurrentUser } from '@/hooks/use-auth';

export const unstable_settings = { initialRouteName: 'tab1' };

export default function TabsLayout() {
  const { data: user, isPending, isError } = useCurrentUser();

  if (isPending) return <ActivityIndicator accessibilityLabel="Checking sign-in" />;
  if (isError || !user) return <Redirect href="/sign-in" />;

  return (
    <NativeTabs
      backgroundColor="#FCFBF8"
      iconColor={{ default: '#738078', selected: '#4E8B5B' }}
      labelStyle={{ default: { fontSize: 10, color: '#738078' }, selected: { fontSize: 10, color: '#4E8B5B', fontWeight: '700' } }}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="tab1">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="home-outline" />} />
        <NativeTabs.Trigger.Label>Recipes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tab2">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="bag-handle-outline" />} />
        <NativeTabs.Trigger.Label>Groceries</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tab3">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="add-circle-outline" />} />
        <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tab4">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="calendar-outline" />} />
        <NativeTabs.Trigger.Label>Planner</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="person-outline" />} />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
