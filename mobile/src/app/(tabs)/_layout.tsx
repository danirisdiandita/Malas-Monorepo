import { NativeTabs } from 'expo-router/unstable-native-tabs';

export const unstable_settings = { initialRouteName: 'tab1' };

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="tab1">
        <NativeTabs.Trigger.Label>Tab 1</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tab2">
        <NativeTabs.Trigger.Label>Tab 2</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tab3">
        <NativeTabs.Trigger.Label>Tab 3</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tab4">
        <NativeTabs.Trigger.Label>Tab 4</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
