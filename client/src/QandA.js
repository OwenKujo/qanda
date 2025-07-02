import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io();

function QandA() {
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    socket.on('questions', (qs) => setQuestions(qs));
    socket.on('new_question', (q) => setQuestions((prev) => [...prev, q]));
    return () => {
      socket.off('questions');
      socket.off('new_question');
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      socket.emit('new_question', question.trim());
      setQuestion('');
    }
  };

  return (
    <div className="App">
      <h1>ช่วง Q&A ถามเลยงับ</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Type your question..."
        />
        <button type="submit">ส่งคำถาม</button>
      </form>
      <h2>คำถาม</h2>
      <ul>
        {questions.map((q, i) => (
          <li key={i}>
            <span>{q.text}</span>
            <span>{new Date(q.timestamp).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default QandA; 