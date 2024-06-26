import React, { useRef, useEffect, useState } from 'react';
import { Outlet, Link } from "react-router-dom";
import Webcam from 'react-webcam';
import * as tmPose from '@teachablemachine/pose';
import * as tmImage from '@teachablemachine/image';

const CombinedComponent = () => {
  // Teachable Machine Pose Model
  const poseModelURL = 'https://teachablemachine.withgoogle.com/models/XQ9WsnS_G/';
  // Teachable Machine Face Image Model
  const imageModelURL = 'https://teachablemachine.withgoogle.com/models/fEN1rKevz/';

  // Pose Model States
  const [poseModel, setPoseModel] = useState(null);
  const [posePredictions, setPosePredictions] = useState([]);
  const [poseMaxPredictions, setPoseMaxPredictions] = useState(0);
  const poseCanvasRef = useRef(null);

  // Image Model States
  const [imageModel, setImageModel] = useState(null);
  const [imagePredictions, setImagePredictions] = useState([]);
  const [imageMaxPredictions, setImageMaxPredictions] = useState(0);

  const webcamRef = useRef(null);
  const lastSpokenOutput = useRef(null);
  const lastSpokenTime = useRef(0);

  useEffect(() => {
    // Initialize Pose Model
    const initPoseModel = async () => {
      const modelURL = poseModelURL + 'model.json';
      const metadataURL = poseModelURL + 'metadata.json';

      const loadedModel = await tmPose.load(modelURL, metadataURL);
      setPoseModel(loadedModel);

      const predictions = loadedModel.getTotalClasses();
      setPoseMaxPredictions(predictions);
    };

    // Initialize Image Model
    const initImageModel = async () => {
      const modelURL = imageModelURL + 'model.json';
      const metadataURL = imageModelURL + 'metadata.json';

      const loadedModel = await tmImage.load(modelURL, metadataURL);
      setImageModel(loadedModel);
      setImageMaxPredictions(loadedModel.getTotalClasses());
    };

    initPoseModel();
    initImageModel();

    // Cleanup functions
    return () => {
      if (poseModel) poseModel.dispose();
      if (imageModel) imageModel.dispose();
    };
  }, []);

  useEffect(() => {
    const loop = async () => {
      if (!poseModel || !imageModel || !webcamRef.current) return;

      const webcam = webcamRef.current.video;
      
      // For Pose Model
      const { pose, posenetOutput } = await poseModel.estimatePose(webcam);
      const posePrediction = await poseModel.predict(posenetOutput);

      // For Image Model
      const imagePrediction = await imageModel.predict(webcam);

      setPosePredictions(posePrediction);
      setImagePredictions(imagePrediction);

      // Speak if class detected
      speakIfDetected(imagePrediction, posePrediction);

      requestAnimationFrame(loop);
    };

    loop();
  }, [poseModel, imageModel]);

  const speakIfDetected = (imagePredictions, posePredictions) => {
    const threshold = 0.9; // Adjust as needed
    let imageClass = null;
    let poseAction = null;

    // Check for image classification
    imagePredictions.forEach(prediction => {
      if (prediction.probability > threshold) {
        imageClass = prediction.className;
      }
    });

    // Check for pose estimation
    posePredictions.forEach(prediction => {
      if (prediction.probability > threshold) {
        poseAction = prediction.className;
      }
    });

    // Update spoken output
    let spokenOutput = lastSpokenOutput.current;
    const currentTime = Date.now();

    if (imageClass && poseAction) {
      spokenOutput = `${imageClass} is ${poseAction}`;
    } else if (imageClass) {
      spokenOutput = `${imageClass} is ${spokenOutput ? spokenOutput.split(' ')[2] : ''}`;
    } else if (poseAction) {
      spokenOutput = `${spokenOutput ? spokenOutput.split(' ')[0] : ''} is ${poseAction}`;
    }

    // Speak if output changed and cooldown period has elapsed
    const cooldownDuration = 2000; // 5 seconds
    if (spokenOutput && spokenOutput !== lastSpokenOutput.current) {
      // Check if the prediction has been above threshold for at least 5 seconds
      if (currentTime - lastSpokenTime.current >= cooldownDuration) {
        speak(spokenOutput);
        lastSpokenOutput.current = spokenOutput;
        lastSpokenTime.current = currentTime;
      }
    } else {
      // If the prediction falls below the threshold, reset the cooldown time
      lastSpokenTime.current = currentTime;
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const drawPose = (pose) => {
    const ctx = poseCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 200, 200);
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
  };

  const ProgressBar = ({ progress }) => (
    <div className="bg-gray-200 h-8 rounded-lg overflow-hidden w-full relative">
      <div className="bg-blue-500 h-full" style={{ width: `${progress * 100}%` }}>
        <div className="absolute inset-0 flex items-center justify-center text-black">
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
      <div className="flex flex-col items-center justify-center" style={{ marginTop: '-60px' }}>
        <div><canvas ref={poseCanvasRef} width={100} height={100}></canvas></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="relative">
          <div className="mb-2">Action Detected</div>
          <div id='pose-predictions' className="mt-1">
            {posePredictions.map((prediction, index) => (
              <div key={index} className="flex items-center mb-2">
                <div className="w-24">{prediction.className}:</div>
                <ProgressBar progress={prediction.probability} />
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="mb-2">Face Detected</div>
          <div id="image-label-container">
            {imagePredictions.map((prediction, index) => (
              <div key={index} className="flex items-center mb-2">
                <div className="w-24">{prediction.className}:</div>
                <ProgressBar progress={prediction.probability} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center">
        <Link to="/object" className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2">Object Detection</Link>
      </div>
    </div>
  </div>
  );
};

export default CombinedComponent;
