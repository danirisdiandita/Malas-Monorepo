import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useEffect, useRef } from 'react';
import { useCurrentUser } from '@/hooks/use-auth';

export const unstable_settings = { initialRouteName: 'recipes' };

export default function TabsLayout() {
  const { data: user, isPending, isError } = useCurrentUser();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isPending && isError && !user && !redirected.current) {
      redirected.current = true;
      router.replace('/sign-in');
    }
  }, [isPending, isError, user]);

  if (isPending || isError || !user) return <ActivityIndicator accessibilityLabel="Checking sign-in" />;

  return (
    <NativeTabs
      backgroundColor="#FCFBF8"
      iconColor={{ default: '#738078', selected: '#4E8B5B' }}
      labelStyle={{ default: { fontSize: 11, color: '#738078' }, selected: { fontSize: 11, color: '#4E8B5B', fontWeight: '700' } }}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="recipes">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="home-outline" />} />
        <NativeTabs.Trigger.Label>Recipes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="groceries">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="bag-handle-outline" />} />
        <NativeTabs.Trigger.Label>Groceries</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="add-circle-outline" />} />
        <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="planner">
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
