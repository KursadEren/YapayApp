// metro.config.js
const {getDefaultConfig} = require('@react-native/metro-config');

module.exports = (async () => {
  // __dirname parametresi önemlidir; bazı CI/CD ortamlarında yol çözümlemesini düzeltir
  const {
    resolver: {assetExts, sourceExts},
    transformer,
  } = await getDefaultConfig(__dirname);

  return {
    transformer,
    resolver: {
      /* 1) .onnx dosyalarını varlık (binary) olarak ele al */
      assetExts: [...assetExts, 'onnx'],

      /* 2) (Opsiyonel) .cjs modüllerini yorumlayabilmek için sourceExts’e ekle */
      sourceExts: [...sourceExts, 'cjs'],

      /* 3) Bazı CI/CD senaryolarında AssetRegistry yolu elle belirtilmeli */
      assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
    },
  };
})();
