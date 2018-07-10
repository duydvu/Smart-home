import React, { Component } from 'react';
import {render} from 'react-dom';
import './Admin.css';
import io from 'socket.io-client';
import TimePicker from 'rc-time-picker';
import '../../../node_modules/rc-time-picker/assets/index.css';
import moment from 'moment';
import Switch from "react-switch";
var myModule = require('../URLhost');
var URLhost = myModule.URLhost;


const socket = io(URLhost, {autoConnect: true, secure: true});
socket.on('connect', () => {
    console.log(socket.id);
});

socket.on('disconnect', () => {
    socket.open();
});


var time = "";
var i = 0;

function check(tf){
    if (tf) return "buttonOn";
    return "buttonOff";
}


export default class Admin extends Component{
    constructor(props) {
        super(props);
        var time1 = props.timerStatusTurnOn ? props.timeOn : moment();
        var time2 = props.timerStatusTurnOff ? props.timeOff : moment();
        this.state = {on: props.status, on1: props.timerStatusTurnOn, on2: props.timerStatusTurnOff, time1: time1, time2: time2};   
        this.handleChange = this.handleChange.bind(this);
        this.handleChange1 = this.handleChange1.bind(this);
        this.handleChange2 = this.handleChange2.bind(this);
        this.onChange1 = this.onChange1.bind(this);
        this.onChange2 = this.onChange2.bind(this);
        var th = this;
        var id = props.id;
        console.log('constructor');

        socket.on('serverToWeb', function(data){
            console.log(data);
            if (data.id == id && data.content == 'ON'){
                th.setState({on : true});
            }
            else if (data.id == id && data.content == 'OFF'){
                th.setState({on : false});        
            }
            else if (data.id == id && data.content == 'setTurnOn'){
                th.setState({on1 : true, time1 : moment(data.time)});                                
            }
            else if (data.id == id && data.content == 'setTurnOff'){
                th.setState({on2 : true, time2 : moment(data.time)});                                
            }
            else if (data.id == id && data.content == 'TurnedOn'){
                th.setState({on1 : false, time1 : moment()});   
                alert("Đã bật thiết bị");                             
            }
            else if (data.id == id && data.content == 'TurnedOff'){
                th.setState({on1 : false, time1 : moment()});                                
                alert("Đã tắt thiết bị");
            }
            else if (data.id == id && data.content == 'cancelTurnOn'){
                th.setState({on1 : false, time1 : moment()});                                
            }
            else if (data.id == id && data.content == 'cancelTurnOff'){
                th.setState({on2 : false, time2 : moment()});                                
            }
        })
    }
    
    handleChange() {
        var th= this;   
        var non = !this.state.on;
        this.state.on = non;
        this.setState({on: non});
        if(this.state.on){
            socket.emit('webToServer', {id: this.props.id, content: 'ON' });
        }
        else{
            socket.emit('webToServer', {id: this.props.id, content: 'OFF'});
        }
    }

    
    handleChange1() {
        var th= this;   
        var non1 = !this.state.on1;
        this.state.on1 = non1;
        this.setState({on: th.state.on, on1: non1, on2: th.state.on2, time1: th.state.time1, time2: th.state.time2});
        if(this.state.on1){
            var strt = new Date(th.state.time1);
            socket.emit('webToServer', {id: th.props.id, content: 'setTurnOn', time: strt});
        }
        else{
            socket.emit('webToServer', {id: th.props.id, content: 'cancelTurnOn'});
        }
    }

    handleChange2() {
        var th= this;   
        var non2 = !this.state.on2;
        this.state.on2 = non2;
        this.setState({on: th.state.on, on1: th.state.on1, on2: non2, time1: th.state.time1, time2: th.state.time2});
        if(this.state.on2){
            var strt = new Date(th.state.time2);            
            socket.emit('webToServer', {id: th.props.id, content: 'setTurnOff', time: strt});
        }
        else{
            var a = {status: 'cancelTurnOff'};
            socket.emit('webToServer', a);
        }
    }

    onChange1(value) {
        var th = this;
        var strTime = value && value.format('HH:mm');
        this.setState({on: th.state.on, time1: moment(strTime,  'hh:mm'), time2: th.state.time2});
        console.log(strTime);
    }

    onChange2(value) {
        var th = this;
        var strTime = value && value.format('HH:mm');
        this.state.time2 = strTime;
        this.setState({on: th.state.on, time1: th.state.time1, time2: moment(strTime,  'hh:mm')});
        console.log(strTime);
    }

    render(){
        return(
            <div className="containerBox">
                <div className={check(this.state.on)} onClick={this.handleChange}> </div>
                                
                <div className="containerTime">
                    <p> Hẹn giờ bật </p>
                    <div className="time">
                        <TimePicker className="timepicker" showSecond={false} value={this.state.time1} onChange={this.onChange1} />
                        <Switch onChange={this.handleChange1} checked={this.state.on1}/>
                    </div>
                </div>

                <div className="containerTime">
                    <p> Hẹn giờ tắt</p>
                    <div className="time1">
                        <TimePicker className="timepicker" showSecond={false} value={this.state.time2} onChange={this.onChange2} />
                        <Switch onChange={this.handleChange2} checked={this.state.on2}/>
                    </div>
                </div>
                <div className="nameText"> {this.props.name} </div>
            </div>                
        )
    }
}
