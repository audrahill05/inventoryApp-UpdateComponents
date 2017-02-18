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
    this._editFirebaseData = this._editFirebaseData.bind(this);
    this._handleFirebaseFormChange = this._handleFirebaseFormChange.bind(this); //Updates the Firebase 
    this._setFireBaseDataEditTable = this._setFireBaseDataEditTable.bind(this); //Sets the uuid we are going to modify
    this._cancelFirebaseEditTable = this._cancelFirebaseEditTable.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
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

  // handleChange(event) {
  //   console.log("Field Updated");
  //   this.props.onChange(event.target.value);
  // }
  handleChange(event) {
    var change = {};
    change[event.target.name] = event.target.value;
    this.setState({editFields: change});
    //this.setState({ typed: event.target.value });
  }

  _cancelFirebaseEditTable(event) {
    event.preventDefault();
    this.setState({ editMode: false});

  }

  _handleFirebaseFormChange(event) {
    event.preventDefault();
    this.props.onChange(event.target.value);
  }

  _setFireBaseDataEditTable(event) {
    event.preventDefault();

    const recordId = event.target.value;

    console.log("The firebase uuid is", event.target.value);

    this.setState({
      editMode: true,
      editUUID: recordId,
      editFields: []
    });

    var self = this; //We loose what this is once we go into the firebase database 

    //Query the firebase data 

    firebase.database().ref().child("inventoryApp").orderByChild("uuid").on('value',
      (snapshot) => {
        snapshot.forEach(function (child) {
          console.log(child.val()) //NOW THE CHILDREN PRINT IN orderByChild
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

  _editFirebaseData(event) {
    event.preventDefault();

    //Getting the values of each child type input

    var details = {};
    event.target.childNodes.forEach(function (el) {
      if (el.tagName === 'INPUT') {
        details[el.name] = el.value
      }
    });


    //Resetting the property value 

    // this.setState({
    //   editMode: false
    // });

    var uuid2 = details["uuid"];
    var self = this;

    firebase.database().ref().child('/inventoryApp/' + uuid2)
      .update({ inventory: details });

    this._loadFirebaseData();

    this.setState({
      editMode: false
    });
  }


  //Allows us to edit the fields and set the data back to itself
  //Handles event when we click the Delete button 

  _handleClick(event) {
    event.preventDefault();

    //console.log(event.target.value)
    //Removes one element
    var uuid3 = event.target.value;

    firebase.database().ref().child('inventoryApp/' + uuid3).remove();

    //Reload the data
    this._loadFirebaseData();
  }

  render() {
    var inputForm;
    var table;
    var rows;
    var editView;
    var output;

    inputForm = <span className="span">
      <h3 className= "inven-head">Please Enter Your Inventory Item</h3>
      <form id="in-form" onSubmit={this.onSubmit.bind(this)}>
        <input className="input" type="text" placeholder="Enter Name..." name="name" />
        <input className="input" type="text" placeholder="Enter Description..." name="description" />
        <input className="input" type="text" placeholder="Enter Quantity..." name="quantity" />
        <button className="input" type="submit">Submit</button>
      </form>
    </span>

    var self = this;
    rows = this.state.inventory.map(function (item, index) {

      //console.log(JSON.stringify(item));
      return Object.keys(item).map(function (s) {
  
        return (
          //<tr key={index}>
          <tr key={s}>
            <th> {item[s].inventory.name} </th>
            <th> {item[s].inventory.description} </th>
            <th> {item[s].inventory.quantity} </th>
            <th><button className="input" value={item[s].inventory.uuid} onClick={self._handleClick.bind(self)}>Delete</button></th>
            <th><button className="input" value={item[s].inventory.uuid} onClick={self._setFireBaseDataEditTable}>Edit</button>
            </th>
          </tr>
        )
      });


    });

    table = (
      <span>
        <Table condensed hover>
          <thead>
            <tr>
              <th> Name </th>
              <th> Description </th>
              <th> Quantity </th>
              <th></th>
              <th></th>
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
        <h2>Edit Inventory Item</h2>
        <form onSubmit={this._editFirebaseData}>
          <input className="input" type="text" value={this.state.editFields.name} onChange={this.handleChange} name="name" />
          <input className="input" type="text" value={this.state.editFields.description} onChange={this.handleChange} name="description" />
          <input className="input" type="text" value={this.state.editFields.quantity} onChange={this.handleChange} name="quantity" />
          <input type="text" className="hide input" value={this.state.editFields.uuid} name="uuid" />
          <button className="input" type="submit">Submit</button>
          <button className="input" onClick={self._cancelFirebaseEditTable}>Cancel</button>
        </form>
      </div>
    );

    if (this.state.editMode) {

      output = (
        <div className="App">
          <div className="App-header">
            <h2>Moon Phase Vintage Co.</h2>
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
            <h2>Moon Phase Vintage Co.</h2>
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
