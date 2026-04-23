// src/utils/faceRecognition.ts
import * as faceapi from 'face-api.js';

export const loadFaceModels = async () => {
  // Models should ideally be placed in the public/models directory
  const MODEL_URL = '/models';
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    return true;
  } catch (error) {
    console.error('Failed to load Face API models:', error);
    return false;
  }
};

export const getFaceDescriptor = async (videoElement: HTMLVideoElement) => {
  const detection = await faceapi.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? detection.descriptor : null;
};

// Compare two descriptors 
export const compareFaces = (descriptor1: Float32Array, descriptor2: Float32Array) => {
  const threshold = 0.6; // lower is stricter
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return distance < threshold;
};
