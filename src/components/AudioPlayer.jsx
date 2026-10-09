import { useEffect, useRef, useState } from "react";

function AudioPlayer({ audioUrl, title }) {
  const audioRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    const updateDuration = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const updateCurrentTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("timeupdate", updateCurrentTime);
    audio.addEventListener("ended", handleEnded);

    updateDuration();

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("timeupdate", updateCurrentTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Audio playback failed:", error);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (time) => {
    if (!Number.isFinite(time) || time < 0) {
      return "0:00";
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress =
    duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <button
        type="button"
        className="audio-player__play"
        onClick={togglePlay}
        aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>

      <div className="audio-player__content">
        <div className="audio-player__info">
          <p className="audio-player__label">Now Playing</p>
          <p className="audio-player__title">{title}</p>
        </div>

        <div className="audio-player__volume">
          <button
            type="button"
            className="audio-player__mute"
            onClick={() => setIsMuted((previous) => !previous)}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted || volume === 0 ? "🔇" : "🔊"}
          </button>

          <input
            type="range"
            className="audio-player__volume-slider"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="Volume"
          />
        </div>

        <div className="audio-player__progress">
          <div className="audio-player__times">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div
            className="audio-player__track"
            onClick={(event) => {
              const audio = audioRef.current;

              if (!audio || !duration) return;

              const rect = event.currentTarget.getBoundingClientRect();
              const clickPosition = event.clientX - rect.left;
              const percentage = clickPosition / rect.width;

              audio.currentTime = percentage * duration;
              setCurrentTime(audio.currentTime);
            }}
            role="slider"
            aria-label={`Seek through ${title}`}
            aria-valuemin="0"
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            tabIndex="0"
          >
            <div
              className="audio-player__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
