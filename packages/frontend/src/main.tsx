import React from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import { Flip } from 'gsap/dist/Flip';
import { useGSAP } from '@gsap/react';
import App from './App';
import './index.css';

// Register GSAP plugins globally
gsap.registerPlugin(Flip, useGSAP);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
