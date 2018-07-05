import React, { Component } from 'react';
import './ScanQR.css'
import QrReader from 'react-qr-scanner'
import Modal from 'react-modal';


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
          result: 'No result',
          modalIsOpen: false
        }
     
        this.handleScan = this.handleScan.bind(this);
        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);  
      }
      handleScan(data){
        if (data != null){
          this.openModal();
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
          width: 480,
        }
     
        return(
          <div className="ScanQR">
            <QrReader
                delay={this.state.delay}
                style={previewStyle}
                onError={this.handleError}
                onScan={this.handleScan}
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
                  
                  <input type="text" name="name" className="inputText"/>                 
                  <input type="submit" value="Submit" className="buttonSubmit" />
                </form>
                <button className="buttonCancel" onClick={this.closeModal}>Cancel</button>
              </div>              
            </Modal>
          </div>
        )
      }
    
}

export default ScanQR;


