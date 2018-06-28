import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Login from './Login/Login';
import ScanQR from './Login/ScanQR/ScanQR';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<ScanQR />, document.getElementById('root'));
registerServiceWorker();
