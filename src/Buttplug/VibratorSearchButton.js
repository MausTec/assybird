import React, { useContext, useState } from 'react'
import { ButtplugDeviceContext } from '@maustec/react-buttplug'

const VibratorSearchButton = () => {
  const { buttplugReady, startScanning, devices } = useContext(ButtplugDeviceContext)
  const [pairing, setPairing] = useState(false)

  const handleClick = (e) => {
    e.preventDefault()
    setPairing(true)
    startScanning()
      .then((msg) => {
        setPairing(false)
        console.log(msg)
      })
      .catch(console.error)
  }

  if (devices.length > 0) {
    return null
  } else if (pairing) {
    return <p>Pairing with devices...</p>
  } else if (buttplugReady) {
    return (
      <a onClick={handleClick} href={'#/'}>
        Connect a Bluetooth Vibrator!
      </a>
    )
  } else {
    return null
  }
}

export default VibratorSearchButton
