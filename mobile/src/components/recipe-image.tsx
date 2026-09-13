import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

export function RecipeImage({ url }: { url?: string }) {
 const [failedURL, setFailedURL] = useState<string>();
 const hasImage = Boolean(url) && failedURL !== url;
 return <Image
  source={hasImage ? {uri: url} : require('@/assets/images/yuzu-logo-transparent.png')}
  style={StyleSheet.absoluteFill}
  contentFit={hasImage ? "cover" : "contain"}
  accessibilityLabel={hasImage ? "Recipe cover" : "Yuzu recipe placeholder"}
  onError={url ? () => setFailedURL(url) : undefined}
 />;
}
