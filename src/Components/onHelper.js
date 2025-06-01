// src/onnxHelper.js
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

// Metro sayesinde require asset olarak gelir:
const modelAsset = require('../../assets/model.onnx');

export async function runOnnxInference(pixelBuffer, numArray) {
  // 1) Yalnızca bir kez session oluşturmak daha verimli olabilir:
  const session = await InferenceSession.create(modelAsset);

  // 2) Tensor’ları sar
  const pixelTensor = new Tensor('float32', pixelBuffer, [1, 3, 224, 224]);
  const numTensor   = new Tensor('float32', numArray,   [1, 4]);

  // 3) Çalıştır
  const outputs = await session.run({
    pixel_input: pixelTensor,
    num_input:   numTensor,
  });

  return outputs.output;  // Float32Array uzunluğu 1
}
