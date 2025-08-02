import React, { useEffect, useRef } from 'react';

export const LiveAudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);

  useEffect(() => {
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    const audioEl = audioRef.current!;
    audioEl.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', () => {
      const mime = 'audio/mpeg'; // Assuming MP3 chunks
      const sourceBuffer = mediaSource.addSourceBuffer(mime);
      sourceBufferRef.current = sourceBuffer;

      const ws = new WebSocket('ws://unity-hub.onrender.com:10000');
      ws.binaryType = 'arraybuffer';

      ws.onmessage = (event) => {
        if (sourceBuffer.updating || mediaSource.readyState !== 'open') return;

        try {
          sourceBuffer.appendBuffer(event.data);
        } catch (err) {
          console.error('appendBuffer error:', err);
        }
      };

      ws.onclose = () => console.log('WebSocket closed');
    });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        background: 'linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%)',
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
        padding: 48,
        margin: '24px auto',
              maxWidth: 1200,
        width:500
      }}
    >
      <div
        style={{
          background: 'linear-gradient(45deg, #4776E6 0%, #8E54E9 100%)',
          borderRadius: '50%',
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          boxShadow: '0 8px 16px rgba(71, 118, 230, 0.2)',
        }}
      >
        <span style={{ fontSize: 36 }}>🔊</span>
      </div>
      <h2 
        style={{ 
          marginBottom: 36, 
          color: '#1a202c', 
          fontWeight: 800, 
          fontSize: 28,
          letterSpacing: '-0.5px',
          textAlign: 'center',
        }}
      >
        Live Audio Stream
      </h2>
      <div
        style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: 480,
        }}
      >
        <audio
          ref={audioRef}
          controls
          autoPlay
          style={{
            width: '100%',
            outline: 'none',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
          }}
        />
      </div>
    </div>
  );
};