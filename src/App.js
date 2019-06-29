import React from 'react';
import HeaderComponent from './components/HeaderComponent.js'
import Stock from './components/Stock.js'
import './App.css';


function App() {
  return (
    <div className="App">
      <HeaderComponent />
      <Stock />
    </div>
  );
}

export default App;
