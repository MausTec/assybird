import React from 'react'

const Bird = ({ height }) => {
    const bottom = height + "%";

    return (
        <div className={'bird'} style={{ bottom }}/>
    )
}

export default Bird;