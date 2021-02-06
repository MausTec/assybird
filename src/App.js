import React, { useState } from 'react';
import logo from './assets/assy-drift-big.png';
import './App.css';
import DeviceProvider, { DeviceContext } from '@maustec/react-edge-o-matic'
import Game from "./Game";

const ConnectionForm = ({state, ip = "", onConnect}) => {
    const [val, setVal] = useState(ip);

    const handleChange = (e) => {
        e.preventDefault();
        setVal(e.target.value);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onConnect(val);
    }

    const disabled = state !== "disconnected"

    return (
        <form onSubmit={handleSubmit}>
            <input disabled={disabled} type={'text'} placeholder={"192.168.x.x"} value={val} onChange={handleChange} />
            <button disabled={disabled} type={'submit'}>{ disabled ? "Connecting..." : "Connect!" }</button>
        </form>
    )
}

function App() {
  return (
    <div className="App">
      <DeviceProvider>
        <DeviceContext.Consumer>
          { ({ state, ip, connect, config: { sensitivity_threshold } }) => (
              state === 'connected' ? <Game arousalLimit={sensitivity_threshold} /> : <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                  Device Address, please.
                </p>
                <ConnectionForm state={state} ip={ip} onConnect={connect} />
              </header>
          )}
        </DeviceContext.Consumer>
      </DeviceProvider>
    </div>
  );
}

export default App;
