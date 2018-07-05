import React, {Component} from 'react';
import Admin from './Admin/Admin';
import Scan from './ScanQR/ScanQR';
import './Control.css';



function Windows(props){
    if (props.tf)
        return (<Admin />);
    return (<Scan />);
}

export default class Control extends Component{
    constructor(props){
        super(props);
        this.state = {tf: true}
        console.log('gg');
    }
    render(){
        return(
            <div className="Control">
                <div className="Body">
                    <Windows tf={this.state.tf} />
                </div>
                <div className="Menu">
                    <div className="buttonControl" onClick={()=>{this.setState({tf: true}); console.log("control")}}> </div>
                    <div className="buttonScan" onClick={()=>{this.setState({tf: false}); console.log("Scan")}}> </div>
                </div>
            </div>
        );
    }
}