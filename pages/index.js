import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
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

    // Refresh every 10 seconds
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
      <Head>
        <title>Telegram Video Streamer</title>
      </Head>

      <main>
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
      </main>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .loading {
          text-align: center;
          padding: 50px;
          font-size: 1.2rem;
        }
        .video-container {
          margin: 20px 0;
        }
        video {
          width: 100%;
          max-height: 500px;
          background: #000;
        }
        .queue ul {
          list-style: none;
          padding: 0;
        }
        .queue li {
          padding: 10px;
          border-bottom: 1px solid #eee;
          margin-bottom: 5px;
        }
        .queue li h4 {
          margin: 0 0 5px 0;
        }
        .queue li span {
          font-size: 0.9rem;
          color: #666;
        }
        .error {
          color: red;
          margin: 10px 0;
          padding: 10px;
          background: #ffeeee;
          border-radius: 5px;
        }
        .next-button {
          margin-top: 20px;
          padding: 10px 20px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
        }
        .next-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
