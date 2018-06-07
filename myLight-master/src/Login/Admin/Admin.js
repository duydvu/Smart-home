import React, { Component } from 'react';
import {render} from 'react-dom';
import './Admin.css';
import io from 'socket.io-client';
import TimePicker from 'rc-time-picker';
import '../../../node_modules/rc-time-picker/assets/index.css';
import moment from 'moment';
import Switch from "react-switch";
import axios from 'axios';

var URL = '115.79.27.129';


const socket = io(URL + ':3001', {autoConnect: true});
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
        this.state = {on: false, on1: false, on2: false, time1: moment(), time2: moment()};   
        this.handleChange = this.handleChange.bind(this);
        this.handleChange1 = this.handleChange1.bind(this);
        this.handleChange2 = this.handleChange2.bind(this);
        this.onChange1 = this.onChange1.bind(this);
        this.onChange2 = this.onChange2.bind(this);
        this.getData = this.getData.bind(this);
        this.getData();
        var th = this;
        
        console.log('constructor');

        socket.on('serverToWeb', function(data){
            console.log(data);
            if (data == 'ON'){
                th.setState({on : true});
            }
            else if (data == 'OFF'){
                th.setState({on : false});        
            }
            else if (data.status == 'setTurnOn'){
                th.setState({on1 : true, time1 : moment(data.timeOn, 'hh:mm')});                                
            }
            else if (data.status == 'setTurnOff'){
                th.setState({on2 : true, time2 : moment(data.timeOff, 'hh:mm')});                                
            }
            else if (data.status == 'cancelTurnOn'){
                th.setState({on1 : false, time1 : moment()});                                
            }
            else if (data.status == 'cancelTurnOff'){
                th.setState({on2 : false, time2 : moment()});                                
            }
        })
        
    }
    
    getData(){
        var th = this;
        axios.get(URL+':3000/getInitial').then(function(res){
            console.log('get initial');
            console.log(res.data);
            th.setState({on: res.data.tf, on1: res.data.tfOn, on2: res.data.tfOff, time1: (res.data.on1) ? res.data.timeOn : moment(), time2: (res.data.on2) ? res.data.timeOff : moment()});   
        }).catch(function(err){console.log(err.message); console.log('err getaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')})  
    }

    handleChange() {
        var th= this;   
        var non = !this.state.on;
        this.state.on = non;
        this.setState({on: non});
        if(this.state.on){
            socket.emit('webToServer', { status: 'ON' });
        }
        else{
            socket.emit('webToServer', { status: 'OFF'});
        }
    }

    
    handleChange1() {
        var th= this;   
        var non1 = !this.state.on1;
        this.state.on1 = non1;
        this.setState({on: th.state.on, on1: non1, on2: th.state.on2, time1: th.state.time1, time2: th.state.time2});
        if(this.state.on1){
            var strt = th.state.time1.format('hh:mm:ss').toString();
            var strmm = moment().format('hh:mm:ss').toString();
            console.log(strt);
            console.log(strmm);
            var h1 = strt[0] + strt[1];
            var m1 = strt[3] + strt[4];
            var s1 = strt[6] + strt[7];

            var r1 = parseInt(h1)*60*60 + parseInt(m1)*60 + parseInt(s1);

            var h2 = strmm[0] + strmm[1];
            var m2 = strmm[3] + strmm[4];
            var s2 = strmm[6] + strmm[7];

            var r2 = parseInt(h2)*60*60 + parseInt(m2)*60 + parseInt(s2);

            var a = {status: 'setTurnOn', time: 0, timeOn: th.state.time1.format('hh:mm')}

            if (r1 > r2){
                a.time = (r1-r2)*1000;
            }
            else{
                a.time = (r1 + 24*60*60 - r2)*1000;
            }
            socket.emit('webToServer', a);
            
            a.time = a.time/1000;
            var h = a.time/3600; a.time = a.time%3600;
            var m = a.time/60; a.time = a.time%60;
            var s = a.time;
            
            alert("Bật thiết bị trong " + parseInt(h) + "h " + parseInt(m) + "m " + parseInt(s) + "s." );
        }
        else{
            var a = {status: 'cancelTurnOn'};
            socket.emit('webToServer', a);
        }
    }

    handleChange2() {
        var th= this;   
        var non2 = !this.state.on2;
        this.state.on2 = non2;
        this.setState({on: th.state.on, on1: th.state.on1, on2: non2, time1: th.state.time1, time2: th.state.time2});
        if(this.state.on2){
            var strt = th.state.time2.format('hh:mm:ss').toString();
            var strmm = moment().format('hh:mm:ss').toString();
            console.log(strt);
            console.log(strmm);
            var h1 = strt[0] + strt[1];
            var m1 = strt[3] + strt[4];
            var s1 = strt[6] + strt[7];

            var r1 = parseInt(h1)*60*60 + parseInt(m1)*60 + parseInt(s1);

            var h2 = strmm[0] + strmm[1];
            var m2 = strmm[3] + strmm[4];
            var s2 = strmm[6] + strmm[7];

            var r2 = parseInt(h2)*60*60 + parseInt(m2)*60 + parseInt(s2);

            var a = {status: 'setTurnOff', time: 0, timeOff: th.state.time2.format('hh:mm')};

            if (r1 > r2){
                a.time = (r1-r2)*1000;
            }
            else{
                a.time = (r1 + 24*60*60 - r2)*1000;
            }
            socket.emit('webToServer', a);
            
            a.time = a.time/1000;
            var h = a.time/3600; a.time = a.time%3600;
            var m = a.time/60; a.time = a.time%60;
            var s = a.time;
            
            alert("Tắt thiết bị trong " + parseInt(h) + "h " + parseInt(m) + "m " + parseInt(s) + "s." );
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
            <div className="containerAdmin">

                <div className={check(this.state.on)} onClick={this.handleChange}> </div>
                                
                <div className="containerTime">
                    <p> Hẹn giờ bật đèn </p>
                    <div className="time">
                        <TimePicker className="timepicker" showSecond={false} value={this.state.time1} onChange={this.onChange1} />
                        <Switch onChange={this.handleChange1} checked={this.state.on1}/>
                    </div>
                </div>

                <div className="containerTime">
                    <p> Hẹn giờ tắt đèn </p>
                    <div className="time1">
                        <TimePicker className="timepicker" showSecond={false} value={this.state.time2} onChange={this.onChange2} />
                        <Switch onChange={this.handleChange2} checked={this.state.on2}/>
                    </div>
                </div>

            </div>
        )
    }
}
