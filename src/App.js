import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { Table } from 'react-bootstrap'

//Firebase dependencies
var uuid = require('uuid');
var firebase = require('firebase');

var config = {
  apiKey: "AIzaSyDKzAuuafl_lb49GxQ5_PS0hm38gFo5mtw",
  authDomain: "inventoryapp-93564.firebaseapp.com",
  databaseURL: "https://inventoryapp-93564.firebaseio.com",
  storageBucket: "inventoryapp-93564.appspot.com",
  messagingSenderId: "194953537660"
};

firebase.initializeApp(config);

class App extends Component {

  constructor(props) {

    super(props);

    /*The constructor for a React component is called before it is mounted. 
    When implementing the constructor for a React.Component subclass, you should call super(props) before any other statement.*/

    this.state = {
      inventory: [],
      submitted: false,
      editMode: false,
      editFields: []
    }

    //Handle Actions 

    this._updateFireBaseRecord = this._updateFireBaseRecord.bind(this); //Updates the Firebase Record
    this._setFireBaseDataEditTable = this._setFireBaseDataEditTable.bind(this); //Sets the uuid we are going to modify
    this._handleFirebaseFormChange = this._handleFirebaseFormChange.bind(this); //Sets the new value of each input

  }

  //Loading the data from firebase
  //These methods are called when an instance of a component is being created and inserted into the DOM (i.e. componentDidMount, constructor, etc):


  componentDidMount() {
    this._loadFirebaseData();
  }

  //Loading the data from firebase 

  _loadFirebaseData() {
    var self = this;

    //Empty any records before we assign new ones
    this.setState({ inventory: [] });

    //Getting data from from firebase
    firebase.database().ref().once('value').then((snapshot) => {
      snapshot.forEach(function (data) {

        self.setState({
          inventory: self.state.inventory.concat(data.val())
        });
      });
    });

  }

  //Allows us to edit the fields and set the data back to itself.
  //It's a ReactJS requirement 
  //Here's a good reference: http://stackoverflow.com/questions/22220873/how-to-reload-input-value-in-react-javascript-with-virtual-dom

  _handleFirebaseFormChange(event) {
    console.log("Field Updated");
    this.props.onChange(event.target.value);
  }

  _setFireBaseDataEditTable(event) {
    event.preventDefault();

    const recordId = event.target.value;

    console.log("The firebase uuid is", event.target.vaule);

    this.setState({
      editMode: true,
      editUUID: recordId,
      editFields: []
    });

    self = this; //We loose what this is once we go into the firebase database 

    //Query the firebase data 

    firebase.database().ref().child("inventoryApp").orderByChild("uuid").on('value',
      (snapshot) => {
        snapshot.forEach(function (child) {
          //console.log(child.val()) //NOW THE CHILDREN PRINT IN orderByChild
          var value = child.val();
          var name = value.inventory.name;
          var quantity = value.inventory.quantity;
          var description = value.inventory.description;
          var uuid = value.inventory.uuid;

          var editFields = {};

          if (uuid === recordId) {
            editFields["name"] = name;
            editFields["quantity"] = quantity;
            editFields["description"] = description;
            editFields["uuid"] = uuid;

            self.setState({ editFields: editFields });
          }
        });
      })
  }

  _updateFireBaseRecord(event) {
    event.preventDefault();

    //Getting the values of each child type input

    var details = {};
    event.target.childNodes.forEach(function (el) {
      if (el.tagName === 'INPUT') {
        details[el.name] = el.value
      }
    });

    console.log("Data has been submitted!!!");

    //Resetting the property value 

    this.setState({
      editMode: false
    });

    var uuid = details["uuid"];
    var self = this;

    firebase.database().ref().child('/inventoryApp/' + uuid)
      .update({ inventory: details });

    this._loadFirebaseData();
  }


  //Allows us to edit the fields and set the data back to itself
  //Handles event when we click the Delete button 

  _handleClick(event) {
    event.preventDefault();

    //console.log(event.target.value)
    //Removes one element
    var uuid = event.target.value;

    firebase.database().ref().child('inventoryApp/' + uuid).remove();

    //Reload the data
    this._loadFirebaseData();
  }

  render() {
    var inputForm;
    var table;
    var rows;
    var editView;
    var output;

    inputForm = <span>
      <h2>Please enter your inventory Item</h2>
      <form id="in-form" onSubmit={this.onSubmit.bind(this)}>
        <input type="text" placeholder="Enter Name..." name="name" />
        <input type="text" placeholder="Enter description..." name="description" />
        <input type="text" placeholder="Enter quantity..." name="quantity" />
        <button type="submit">Submit</button>
      </form>
    </span>

    var self = this;
    rows = this.state.inventory.map(function (item, index) {

      //console.log(JSON.stringify(item));
      return Object.keys(item).map(function (s) {
        //console.log("ITEM:" + item[s].name)
        //console.log("Name:" + item[s].inventory.name)
        //console.log("Item Information: ", item[s]);
        return (
          //<tr key={index}>
          <tr key={s}>
            <th> {item[s].inventory.name} </th>
            <th> {item[s].inventory.description} </th>
            <th> {item[s].inventory.quantity} </th>
            <th><button value={item[s].inventory.uuid} onClick={self._handleClick.bind(self)}>Delete</button></th>
            <th><button vaule={item[s].inventory.uuid} onClick={self._setFireBaseDataEditTable.bind(self)}>Edit</button>
            </th>
          </tr>
        )
      });


    });

    table = (
      <span>
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th> Name </th>
              <th> Description </th>
              <th> Quantity </th>
              <th> Actions </th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      </span>
    )

    editView = (
      <div>
        <h2>Edit Mode</h2>
        <form onSubmit={this._updateFireBaseRecord}>
          <input type="text" value={this.state.editFields.name} onChange={this._handleFirebaseFormChange} name="name" />
            <input type="text" value={this.state.editFields.description} onChange={this._handleFirebaseFormChange} name="description" />
          <input type="text" value={this.state.editFields.quantity} onChange={this._handleFirebaseFormChange} name="quantity" />
          <input type="text" className="hideinput" value={this.state.editFields.uuid} name="uuid" />
          <button type="submit" type="submit" >Submit</button>
        </form>
      </div>
    );

    if (this.state.editMode) {

      output = (
        <div className="App">
          <div className="App-header">
            <h2>Inventory App</h2>
          </div>
          <div className="text-center">
            {editView}
          </div>
        </div>
      );
    } else {
      output = (
        <div className="App">
          <div className="App-header">
            <h2>Inventory App</h2>
          </div>
          <div className="text-center">
            {inputForm}
            <br />
            {table}
          </div>
        </div>
      );

    }

    return (
      <div className="App">
        {output}
      </div>
    );
  }

  //Adding our function that will handle our form submit 

  onSubmit(event) {

    event.preventDefault();

    //Creating our intitial variables
    const details = {}
    const id = uuid.v1(); //generating our unique key 

    //Go through each element in the form making sure it's an input element

    event.target.childNodes.forEach(function (el) {
      if (el.tagName === 'INPUT') {
        details[el.name] = el.value
      } else {
        el.value = null
      }

      //Adding one more element uuid
      details['uuid'] = id;

    });



    //Saving to firebase

    firebase.database().ref('inventoryApp/' + id).set({
      inventory: details
    });

    this.setState({
      submitted: true
    })

    this._loadFirebaseData();

  }

}



export default App;
