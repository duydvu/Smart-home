import React, { Component } from 'react';
import './SignUp.css';
import Control from './Control';
import axios from 'axios';
import Notifications, {notify} from 'react-notify-toast';

var myModule = require('./URLhost');
var URLhost = myModule.URLhost;

class SignUp extends Component {
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
    var history = this.props.history;
    axios.post(URLhost + '/signup', {
      username: this.state.user,
      password: this.state.password
    })
    .then(function (response) {
      if(response.status == 200){
        history.replace({pathname: '/'});
      }
    })
    .catch(function (error) {
      console.log(error);
      if (error.response && error.response.status == 400){
        notify.show("Trùng tên tài khoản");
      }
      else{
        notify.show('Kiểm tra lại mạng');
      }
    });
  }

  _handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.isSuccess();
    }
  }

  render() {
    return(
      <div className="container">
        <Notifications />
        <div className="spacebg"></div>
        <div className="login">
          <div className="spacelg"> </div>
          <div className="boxlogin"> 
            <div className="toplogin"> 
              <p className="text"> SignUp </p>
            </div>
            <div className="bodylogin"> 
              <input type="text" onKeyPress={this._handleKeyPress} name="user" 
                className="inputtext" onChange={this.getUser}/>
              <input type="password" onKeyPress={this._handleKeyPress} name="password"
                className="inputtext" onChange={this.getPassword}/>
              <button className="button" onClick={this.isSuccess}> SignUp </button>
            </div>
          </div>
          <div className="spacelg"> </div>
        </div>
        <div className="spacebg"></div>
      </div>
    );
  }
} 

export default SignUp;
