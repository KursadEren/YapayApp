// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const {
    resolver: { assetExts, sourceExts },
    transformer,
  } = await getDefaultConfig();

  return {
    transformer,  
    resolver: {
      // var olan assetExts’e onnx’i ekliyoruz:
      assetExts: [...assetExts, 'onnx'],
      // sourceExts’i “cjs” gibi ekstraye ihtiyaç yoksa olduğu gibi bırakabilirsiniz
      sourceExts: sourceExts,
      // Bu satır CI/CD ya da bazen lazım: 
      assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
    },
  };
})();
