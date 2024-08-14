import React, { useState, useEffect, useRef } from "react";
import "./styles.css";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

function App() {
  const [isListening, setIsListening] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);
  const startTimeRef = useRef(null);
  const lastSpeechRef = useRef(Date.now());
  const currentSequenceRef = useRef({ text: "", saved: false });

  useEffect(() => {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ja-JP";

    recognition.onresult = (event) => {
      const now = Date.now();
      const timeSinceLastSpeech = now - lastSpeechRef.current;

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (
        timeSinceLastSpeech > 1500 ||
        currentSequenceRef.current.text === ""
      ) {
        // 新しいシーケンスの開始
        if (
          currentSequenceRef.current.text !== "" &&
          !currentSequenceRef.current.saved
        ) {
          handleSaveNote(currentSequenceRef.current.text);
        }
        currentSequenceRef.current = { text: "", saved: false };
      }

      if (finalTranscript !== "") {
        currentSequenceRef.current.text += finalTranscript + " ";
        currentSequenceRef.current.saved = false;
        setCurrentNote(currentSequenceRef.current.text + interimTranscript);
      } else {
        setCurrentNote(currentSequenceRef.current.text + interimTranscript);
      }

      lastSpeechRef.current = now;
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    // 定期的に現在のノートをチェックし、必要に応じて保存する
    const checkAndSaveInterval = setInterval(() => {
      const now = Date.now();
      if (
        now - lastSpeechRef.current > 1500 &&
        currentSequenceRef.current.text.trim() !== "" &&
        !currentSequenceRef.current.saved
      ) {
        handleSaveNote(currentSequenceRef.current.text);
      }
    }, 1000);

    return () => clearInterval(checkAndSaveInterval);
  }, [isListening]);

  const handleListen = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      // 停止時に現在のノートを保存（まだ保存されていない場合のみ）
      if (
        currentSequenceRef.current.text.trim() !== "" &&
        !currentSequenceRef.current.saved
      ) {
        handleSaveNote(currentSequenceRef.current.text);
      }
      // リセット
      currentSequenceRef.current = { text: "", saved: false };
      setCurrentNote("");
    } else {
      recognition.start();
      setIsListening(true);
      startTimeRef.current = Date.now();
      setCurrentNote("");
      currentSequenceRef.current = { text: "", saved: false };
      lastSpeechRef.current = Date.now();
    }
  };

  const handleSaveNote = (noteText) => {
    if (noteText.trim() !== "") {
      const currentTime = Date.now();
      const elapsedTime = Math.floor(
        (currentTime - (startTimeRef.current || currentTime)) / 1000
      );
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      const timeStamp = `[${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}]`;

      setSavedNotes((prevNotes) => [
        {
          text: `${timeStamp} ${noteText.trim()}`,
          timestamp: currentTime,
        },
        ...prevNotes,
      ]);

      currentSequenceRef.current.saved = true;
    }
  };

  return (
    <div className="App">
      <h1>自分がコールした内容を表示するだけのアプリ</h1>
      <div className="container">
        <div className="box">
          <h2>最新のコール</h2>
          {isListening ? <span>🎙️</span> : <span>🛑</span>}
          <button onClick={handleListen}>
            {isListening ? "停止" : "開始"}
          </button>
          <p className="current-note">{currentNote}</p>
        </div>
        <div className="box">
          <h2>コール履歴</h2>
          <div className="note-list">
            {savedNotes.map((n, index) => (
              <p key={index}>{n.text}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
