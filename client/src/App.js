import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [currentVideo, setCurrentVideo] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef(null);

  const fetchCurrentVideo = async () => {
    try {
      const res = await fetch('/api/stream/current');
      const data = await res.json();
      if (data.success) {
        setCurrentVideo(data.data);
        setError('');
      } else {
        setError('No video currently streaming');
      }
    } catch (err) {
      setError('Failed to fetch current video');
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      if (data.success) {
        setQueue(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    }
  };

  const playNextVideo = async () => {
    try {
      const res = await fetch('/api/stream/next', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchCurrentVideo();
        await fetchQueue();
      }
    } catch (err) {
      setError('Failed to play next video');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchCurrentVideo();
      await fetchQueue();
      setLoading(false);
    };
    loadData();

    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleEnded = () => {
      if (queue.length > 0) {
        playNextVideo();
      }
    };

    videoElement.addEventListener('ended', handleEnded);
    return () => {
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [queue]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <h1>Telegram Channel Video Streamer</h1>
      
      {error && <div className="error">{error}</div>}

      <div className="current-video">
        <h2>Now Playing</h2>
        {currentVideo ? (
          <div className="video-container">
            <video
              ref={videoRef}
              controls
              autoPlay
              key={currentVideo._id}
            >
              <source 
                src={`/api/stream/${currentVideo._id}`} 
                type={currentVideo.mimeType || 'video/mp4'} 
              />
              Your browser does not support the video tag.
            </video>
            <h3>{currentVideo.title}</h3>
            {currentVideo.duration && (
              <p>Duration: {Math.floor(currentVideo.duration / 60)}:{String(currentVideo.duration % 60).padStart(2, '0')}</p>
            )}
          </div>
        ) : (
          <p>No video currently playing</p>
        )}
      </div>

      <div className="queue">
        <h2>Up Next ({queue.length})</h2>
        {queue.length > 0 ? (
          <ul>
            {queue.map((item) => (
              <li key={item._id}>
                <h4>{item.videoId?.title || 'Untitled Video'}</h4>
                {item.videoId?.duration && (
                  <span>Duration: {Math.floor(item.videoId.duration / 60)}:{String(item.videoId.duration % 60).padStart(2, '0')}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Queue is empty</p>
        )}
      </div>

      <button 
        onClick={playNextVideo} 
        disabled={!currentVideo || queue.length === 0}
        className="next-button"
      >
        Play Next Video
      </button>
    </div>
  );
}

export default App;
