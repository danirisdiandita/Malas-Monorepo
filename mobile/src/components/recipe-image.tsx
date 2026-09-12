import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

export function RecipeImage({ url }: { url?: string }) {
 const [failedURL, setFailedURL] = useState<string>();
 if (!url || failedURL === url) return null;
 return <Image source={{uri:url}} style={StyleSheet.absoluteFill}
  contentFit="cover" accessibilityLabel="Recipe cover" onError={() => setFailedURL(url)} />;
}
