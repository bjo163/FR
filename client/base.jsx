import React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
export function createApp () {
  const [input, setInput] = useState(null)
  return (
    <p>Hello world from React and @fastify/vite!</p>
  )
}