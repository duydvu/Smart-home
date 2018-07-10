import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Login from './Login/Login';
import SignUp from './Login/SignUp';
import Control from './Login/Control';
import ScanQR from './Login/ScanQR/ScanQR';
import Test from './Test';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router, Route } from 'react-router-dom';

ReactDOM.render((
        <Router>
            <div>
                <Route  path="/login" component={Login} />
                <Route  path="/signup" component={SignUp} />
                <Route exact path="/" component={Control} />
            </div>
        </Router>
    ), document.getElementById('root'));
registerServiceWorker();
