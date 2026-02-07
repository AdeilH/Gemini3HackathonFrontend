import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import AssessmentResult from './AssessmentResult';

const VideoUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Webcam states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startWebcam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      // Removed direct videoRef.current.srcObject assignment here 
      // as it's handled by useEffect when the element renders
    } catch (err) {
      console.error("Error accessing webcam", err);
      setError("Could not access webcam. Please check permissions.");
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    setRecordedChunks([]);
    const options = { mimeType: 'video/webm;codecs=vp8,opus' };
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      // @ts-ignore
      options.mimeType = 'video/mp4';
    }
    
    const mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      // Create blob from chunks immediately to avoid issues with empty chunks
      // Use the options.mimeType which was defined at the start of recording
      const recordedBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
      const fileName = mediaRecorder.mimeType.includes('mp4') ? 'recorded-video.mp4' : 'recorded-video.webm';
      const recordedFile = new File([recordedBlob], fileName, { type: mediaRecorder.mimeType });
      
      setFile(recordedFile);
      setVideoUrl(URL.createObjectURL(recordedBlob));
      stopWebcam();
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const options = mediaRecorderRef.current?.mimeType || 'video/webm';
      const blob = new Blob(recordedChunks, { type: options });
      const fileName = options.includes('mp4') ? 'recorded-video.mp4' : 'recorded-video.webm';
      const recordedFile = new File([blob], fileName, { type: options });
      setFile(recordedFile);
      setVideoUrl(URL.createObjectURL(blob));
    }
  }, [recordedChunks, isRecording]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'video/mp4' && selectedFile.type !== 'video/webm') {
        setError('Please select an MP4 or WebM video file.');
        setFile(null);
        setVideoUrl(null);
        return;
      }
      setFile(selectedFile);
      setVideoUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setResponse(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or record a video first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/videoassessment/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      setResponse(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
      // For demonstration purposes, if it's a 404 or something, we can still show the mock data if the user wants to see how it looks
      // But here we'll just set the response if available
      if (err.response?.data) {
        setResponse(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-upload-container" style={{ maxWidth: response ? '1000px' : '450px', transition: 'max-width 0.5s ease' }}>
      <h2>Video Assessment</h2>
      
      {!response && (
        <>
          <div className="upload-method-toggle" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button type="button" onClick={() => { stopWebcam(); setFile(null); setVideoUrl(null); }} className={!stream ? 'active' : ''} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Upload File</button>
            <button type="button" onClick={startWebcam} className={stream ? 'active' : ''} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Record Video</button>
          </div>

          <form onSubmit={handleUpload}>
            {!stream ? (
              <div className="form-group">
                <label>Select Video (MP4/WebM):</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="webcam-container">
                <video ref={videoRef} autoPlay muted playsInline className="webcam-view" />
                {isRecording && (
                  <div className="recording-indicator">
                    <span className="dot"></span>
                    REC
                  </div>
                )}
                <div className="webcam-controls">
                  {!isRecording ? (
                    <button type="button" onClick={startRecording} className="btn-record">Start Recording</button>
                  ) : (
                    <button type="button" onClick={stopRecording} className="btn-stop">Stop Recording</button>
                  )}
                  <button type="button" onClick={stopWebcam} className="btn-secondary">Cancel</button>
                </div>
              </div>
            )}
            
            {(file || videoUrl) && !isRecording && (
              <div className="video-preview" style={{ marginTop: '1rem' }}>
                <video width="100%" controls src={videoUrl || undefined} style={{ borderRadius: '0.5rem' }}>
                  Your browser does not support the video tag.
                </video>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  Ready to upload: {file?.name} ({(file!.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
            )}

            <button type="submit" disabled={loading || !file || isRecording} style={{ marginTop: '1rem' }}>
              {loading ? 'Processing...' : 'Start Assessment'}
            </button>
          </form>
        </>
      )}

      {loading && (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Assessment in progress, please wait...</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>This may take a minute depending on video length</p>
        </div>
      )}

      {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}

      {response && (
        <div>
          <AssessmentResult data={response} />
          <button 
            onClick={() => { setResponse(null); setFile(null); setVideoUrl(null); }} 
            className="btn-secondary" 
            style={{ marginTop: '2rem' }}
          >
            Start New Assessment
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
