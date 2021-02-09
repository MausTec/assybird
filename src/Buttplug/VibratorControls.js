import React, { useContext, useState } from 'react'
import {
  ButtplugDeviceContext,
  ButtplugDeviceController
} from '@maustec/react-buttplug'

const VibratorControls = ({ speed }) => {
  const { devices } = useContext(ButtplugDeviceContext)

  return (
      <ul>
        {devices.map((device) => (
          <ButtplugDeviceController key={device.Index} device={device} vibrate={speed}>
            <li>{device.Name}</li>
          </ButtplugDeviceController>
        ))}
      </ul>
  )
}

export default VibratorControls
