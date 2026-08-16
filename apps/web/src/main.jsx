import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
	<App />
);

// Register the PWA service worker (production + same-origin only).
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js', { scope: '/' })
			.catch((err) => {
				// eslint-disable-next-line no-console
				console.info('PWA service worker registration failed:', err);
			});
	});
}
