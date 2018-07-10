import React, { Component } from 'react';
import './ScanQR.css'
import QrReader from 'react-qr-scanner'
import Modal from 'react-modal';
import axios from 'axios';
var myModule = require('../URLhost');
var URLhost = myModule.URLhost;


const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    transform             : 'translate(-50%, -50%)',
    backgroundColor       : '#F0FFFF'
  }
};

class ScanQR extends Component {
    constructor(props){
        super(props)
        this.state = {
          delay: 100,
          result: '',
          modalIsOpen: false, 
          value: ''
        }
     
        this.handleScan = this.handleScan.bind(this);
        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);  
        this.addDevice = this.addDevice.bind(this);
        this.handleChange = this.handleChange.bind(this);
      }
      
      addDevice(e){
        e.preventDefault();
        var id_device = this.state.result;
        var name = this.state.value;
        console.log(id_device);
        console.log(name);
        axios.post(URLhost + '/addDevice', {
            id: id_device, user_id: "2", name: name            
            }
          ).then(function (response) {
              if(response.status == 200){
                alert("Thêm thiết bị thành công");
              }
          }).catch(function (error) {
              console.log(error);
          });
      }

      handleChange(event) {
        this.setState({value: event.target.value});
      }
    
      handleScan(data){
        if (data != null){
          this.openModal();
          this.setState({result: data});
        }
      }
      handleError(err){
        console.error(err)
      }
      openModal() {
        this.setState({modalIsOpen: true});
      }
      afterOpenModal() {
        // references are now sync'd and can be accessed.
      }
      closeModal() {
        this.setState({modalIsOpen: false});
      }
      

      render(){
        const previewStyle = {
          height: 500,
          width: 550,
        }
     
        return(
          <div className="ScanQR">  
            <QrReader
              delay={this.state.delay}
              onError={this.handleError}
              onScan={this.handleScan}
              style={previewStyle}
              />
            <Modal
              isOpen={this.state.modalIsOpen}
              onAfterOpen={this.afterOpenModal}
              onRequestClose={this.closeModal}
              style={customStyles}
              contentLabel="Example Modal"
            >
              <div className="modal">
                <p className="headerText">  Nhập tên thiết bị: </p>
                <form className="form">
                  <input type="text" onChange={this.handleChange} value={this.state.value} className="inputText"/>                 
                  <button onClick={this.addDevice} className="buttonSubmit"> Submit </button>  
                </form>
                <button className="buttonCancel" onClick={this.closeModal}>Cancel</button>
              </div>              
            </Modal>
          </div>
        )
      }
    
}

export default ScanQR;


