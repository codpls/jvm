import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { ClassViewer } from './ClassViewer';
import { HexViewer } from './HexViewer';

function App() {
  const [arr, setArr] = useState(new Uint8Array());
  useEffect(() => {
    fetch('JavaClass.class')
        .then(resp => resp.arrayBuffer())
        .then(buffer => {
          console.log(buffer);
          const u8arr = new Uint8Array(buffer);
          console.log(u8arr);
          console.log(Array.from(u8arr).map(c => c.toString(16)));
          setArr(u8arr);
        });
  }, []);
  return (
    <div className="App">
      <HexViewer data={arr}/>
      <ClassViewer data={arr}/>
    </div>
  );
}

export default App;
