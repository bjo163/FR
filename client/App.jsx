import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function App() {
  const [input, setInput] = useState(null);
  
  return (
    <div>
      <p>Hello world from React and @fastify/vite!</p>
    </div>
  );
}
