import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

//tells React to render the App component inside the root element of the HTML document(index.html). 
ReactDOM.createRoot(document.getElementById('root')).render(
  //strict mode checks for potential problems in the App code.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
