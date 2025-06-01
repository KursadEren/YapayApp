// App.js

import React, { useState, useEffect } from 'react';
import {
  View, Button, Text, Image, ActivityIndicator, Alert, StyleSheet
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import jpeg from 'jpeg-js';
import { InferenceSession, Tensor } from 'onnxruntime-react-native'; // veya @pytorch/react-native ile Tensor
import modelAsset from './assets/model.onnx'

export default function App() {
  const [session, setSession]       = useState(null);
  const [photoUri, setPhotoUri]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [prediction, setPrediction] = useState(null);

  // Uygulama açıldığında ONNX session’ı yarat
  useEffect(() => {
    (async () => {
      const s = await InferenceSession.create(modelAsset);
      setSession(s);
    })();
  }, []);

  // JPEG dosyasını base64 → Uint8Array → raw pixel’a çevirir
  async function decodeImageToTensor(uri) {
    // 1) Dosyayı base64 okuyun
    //    Android: content://… URI’leri desteklemek için önce gerçek path’e çevirmeniz gerekebilir
    const path = uri.replace('file://', '');
    const b64  = await RNFS.readFile(path, 'base64');
    const raw  = Buffer.from(b64, 'base64');            // global Buffer olmalı
    // 2) jpeg-js ile decode
    const { data, width, height } = jpeg.decode(raw, { useTArray: true });
    // 3) RGBA → Float32Array[NCHW]
    //    Modeliniz 224×224 bekliyorsa, önce ImageResizer ile 224×224’e indirmiş olmalısınız
    const floatArray = new Float32Array(1 * 3 * height * width);
    let offset = 0;
    for (let i = 0; i < width * height; i++) {
      const r = data[i*4+0] / 255;
      const g = data[i*4+1] / 255;
      const b = data[i*4+2] / 255;
      // normalize
      floatArray[offset++] = (r - 0.485) / 0.229;
      floatArray[offset++] = (g - 0.456) / 0.224;
      floatArray[offset++] = (b - 0.406) / 0.225;
    }
    return floatArray;
  }

  async function handleImage(source) {
    if (!session) {
      Alert.alert('Model henüz yüklenmedi');
      return;
    }
    setLoading(true);
    setPrediction(null);

    try {
      // 1) Kamera veya galeri aç
      const opts = { mediaType:'photo', quality:0.8 };
      const res = source === 'camera'
        ? await launchCamera(opts)
        : await launchImageLibrary(opts);
      if (res.didCancel) { setLoading(false); return; }
      if (res.errorCode) throw new Error(res.errorMessage);
      const uri = res.assets[0]?.uri;
      if (!uri) throw new Error('URI bulunamadı');
      setPhotoUri(uri);

      // 2) 224×224 resize
      const { uri: small } = await ImageResizer.createResizedImage(
        uri, 224, 224, 'JPEG', 100, 0
      );

      // 3) Decode image → Float32Array
      const pixelBuffer = await decodeImageToTensor(small);

      // 4) Hazır sayısal veri (kendi verinle değiştir)
      const numData = new Float32Array([100, 105, 0, 0]);

      // 5) ONNX inference
      const outputs = await session.run({
        pixel_input: new Tensor('float32', pixelBuffer, [1,3,224,224]),
        num_input:   new Tensor('float32', numData,    [1,4]),
      });
      const score = outputs.output[0];

      setPrediction(
        score > 0
          ? `Artacak 📈 (score=${score.toFixed(4)})`
          : `Düşecek 📉 (score=${score.toFixed(4)})`
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Hata', e.message || 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grafik Tahmin Uygulaması</Text>

      <View style={styles.row}>
        <Button title="Fotoğraf Çek"   onPress={()=>handleImage('camera')} />
        <View style={{width:16}}/>
        <Button title="Galeriden Seç" onPress={()=>handleImage('library')} />
      </View>

      {loading && <ActivityIndicator size="large" style={{margin:20}} />}

      {photoUri && (
        <Image source={{uri:photoUri}}
               style={styles.image}
               resizeMode="contain" />
      )}

      {prediction && (
        <Text style={styles.pred}>{prediction}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, alignItems:'center', backgroundColor:'#fff' },
  title:     { fontSize:22, marginTop:20, fontWeight:'600' },
  row:       { flexDirection:'row', marginTop:20 },
  image:     { width:224, height:224, marginTop:20, borderColor:'#ccc', borderWidth:1 },
  pred:      { marginTop:16, fontSize:18 },
});
