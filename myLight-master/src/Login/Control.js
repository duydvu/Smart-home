import React, {Component} from 'react';
import Admin from './Admin/Admin';
import Scan from './ScanQR/ScanQR';
import './Control.css';
import Notifications, {notify} from 'react-notify-toast';
import axios from 'axios';

var myModule = require('./URLhost');
var URLhost = myModule.URLhost;

function AdminList(props) {
    const arr = props.arr;
    const tf = props.tf;
    const listItems = arr.map((node) => {
            return (
                <Admin 
                    id={node.id}
                    name={node.name} 
                    status={node.status} 
                    timerStatusTurnOn={node.timerStatusTurnOn} 
                    timerStatusTurnOff={node.timerStatusTurnOff} 
                    timeOn={node.timeOn} 
                    timeOff={node.timeOff}
                    key={node.id}
                />
            )
        }
    );
    if (tf){
        return (
        <div className="containerAdmin"> {listItems} </div>
        );
    }
    else{
        return(<Scan />)
    }
  }
  
export default class Control extends Component{
    constructor(props){
        super(props);
        var history = props.history;
        console.log('constructor control');
        console.log(URLhost);
        this.state = {tf: true, arr: []};
        var th = this;
        axios.post(URLhost + '/getID', {
                id: "2"          
                }
            ).then(function (response) {
                if(response.status == 200){
                    console.log(response.data);
                    th.setState({th: th.state.tf, arr: response.data.devices});
                }
            }).catch(function (error) {
                console.log(error);
            });
        
    }
    render(){
        return(
            <div className="Control">
                <Notifications />
                <div className="Header"> </div>
                <div className="Body">
                    <AdminList tf={this.state.tf} arr={this.state.arr}/>
                </div>
                <div className="Menu">
                    <div className="buttonControl" onClick={()=>{this.setState({tf: true}); console.log("control")}}> </div>
                    <div className="buttonScan" onClick={()=>{this.setState({tf: false}); console.log("Scan")}}> </div>
                </div>
            </div>
        );
    }
}