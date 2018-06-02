import React, { Component } from 'react';
import './Login.css';
import Admin from './Admin/Admin';

class Login extends Component {
  constructor(props){
    super(props);
    this.state = {user: '', password: '', isSuccess: false};
    this.getUser = this.getUser.bind(this);
    this.getPassword = this.getPassword.bind(this);
    this.isSuccess = this.isSuccess.bind(this);
    this.render = this.render.bind(this);
    this._handleKeyPress = this._handleKeyPress.bind(this);
  }

  getUser(event){
    this.setState({user: event.target.value});
  }

  getPassword(event){
    this.setState({password: event.target.value});
  }
  
  isSuccess(){
    this.setState({isSuccess : this.state.user === 'admin' && this.state.password === 'root'});
  }

  _handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.isSuccess();
    }
  }

  render() {
    if (!this.state.isSuccess)
      return <Admin />;
    else
      return(
        <div className="container">
          <div className="spacebg"></div>
          <div className="login">
            <div className="spacelg"> </div>
            <div className="boxlogin"> 
              <div className="toplogin"> 
                <p className="text"> LOGIN </p>
              </div>
              <div className="bodylogin"> 
                <input type="text" onKeyPress={this._handleKeyPress} name="user" 
                  className="inputtext" onChange={this.getUser}/>
                <input type="password" onKeyPress={this._handleKeyPress} name="password"
                  className="inputtext" onChange={this.getPassword}/>
                <button className="button" onClick={this.isSuccess}> Login </button>
              </div>
            </div>
            <div className="spacelg"> </div>
          </div>
          <div className="spacebg"></div>
        </div>
      );
  }
} 

export default Login;
