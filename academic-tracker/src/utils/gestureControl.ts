// src/utils/gestureControl.ts
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

let gestureRecognizer: GestureRecognizer | null = null;
let isRunning = false;

export const initializeGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO"
  });
  
  return gestureRecognizer;
};

export const startGestureDetection = (
  videoElement: HTMLVideoElement, 
  onGesture: (gesture: string) => void
) => {
  if (!gestureRecognizer) return;
  isRunning = true;
  
  let lastVideoTime = -1;
  const predictWebcam = () => {
    if (!isRunning) return;

    const nowInMs = Date.now();
    if (videoElement.currentTime !== lastVideoTime) {
      lastVideoTime = videoElement.currentTime;
      const results = gestureRecognizer!.recognizeForVideo(videoElement, nowInMs);

      if (results.gestures.length > 0) {
        const categoryName = results.gestures[0][0].categoryName;
        // Adjust threshold
        if (results.gestures[0][0].score > 0.6) {
           onGesture(categoryName);
        }
      }
    }
    
    // Call next frame
    requestAnimationFrame(predictWebcam);
  };
  
  predictWebcam();
};

export const stopGestureDetection = () => {
  isRunning = false;
};
