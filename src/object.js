import React, { useRef, useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import Webcam from 'react-webcam';
import * as tmImage from '@teachablemachine/image';

const CombinedComponent = () => {
  // Teachable Machine Face Image Model
  const imageModelURL = 'https://teachablemachine.withgoogle.com/models/jOnNJrF31/';

  // Image Model States
  const [imageModel, setImageModel] = useState(null);
  const [imagePredictions, setImagePredictions] = useState([]);
  const [imageMaxPredictions, setImageMaxPredictions] = useState(0);

  const webcamRef = useRef(null);
  const lastSpokenOutput = useRef(null);

  useEffect(() => {
    // Initialize Image Model
    const initImageModel = async () => {
      const modelURL = imageModelURL + 'model.json';
      const metadataURL = imageModelURL + 'metadata.json';

      const loadedModel = await tmImage.load(modelURL, metadataURL);
      setImageModel(loadedModel);
      setImageMaxPredictions(loadedModel.getTotalClasses());
    };

    initImageModel();

    // Cleanup function
    return () => {
      if (imageModel) imageModel.dispose();
    };
  }, []);

  useEffect(() => {
    const loop = async () => {
      if (!imageModel || !webcamRef.current) return;

      const webcam = webcamRef.current.video;

      // For Image Model
      const imagePrediction = await imageModel.predict(webcam);

      setImagePredictions(imagePrediction);

      // Speak if class detected
      speakIfDetected(imagePrediction);

      requestAnimationFrame(loop);
    };

    loop();
  }, [imageModel]);

  const speakIfDetected = (imagePredictions) => {
    const threshold = 0.9; // Adjust as needed
    let imageClass = null;

    // Check for image classification
    imagePredictions.forEach(prediction => {
      if (prediction.probability > threshold) {
        imageClass = prediction.className;
      }
    });

    // Update spoken output
    let spokenOutput = lastSpokenOutput.current;
    if (imageClass) {
      spokenOutput = `${imageClass} is detected nearby`;
    }

    // Speak if output changed
    if (spokenOutput && spokenOutput !== lastSpokenOutput.current) {
      speak(spokenOutput);
      lastSpokenOutput.current = spokenOutput;
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const ProgressBar = ({ progress }) => (
    <div className="progress-bar-container bg-gray-200 h-8 rounded-lg overflow-hidden w-full relative">
      <div className="progress-bar bg-blue-500 h-full" style={{ width: `${progress * 100}%` }}>
        <div className="progress-bar-text absolute inset-0 flex items-center justify-center text-black">
          {Math.round(progress * 100)}%
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="mb-4">
          <Webcam
            ref={webcamRef}
            muted={true}
            className="w-full h-auto"
          />
        </div>
        <div className="relative">
          <div className="mb-2 items-center justify-center">Detected in the Frame</div>
          <div id="image-label-container">
            {imagePredictions.map((prediction, index) => (
              <div key={index} className="flex items-center mb-2">
                <div className="w-24">{prediction.className}:</div>
                <ProgressBar progress={prediction.probability} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Link to="/home" className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default CombinedComponent;
