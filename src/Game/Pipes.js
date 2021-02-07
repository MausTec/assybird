import React from 'react'
import analBeads from '../assets/anal-beads.png'

const renderPipe = (pipe) => {
    const left = pipe.position + '%';
    const bottom = (pipe.height + (pipe.gap / 2)) + '%'
    const top = 100 - (pipe.height - (pipe.gap / 2)) + '%'
    const backgroundImage = `url('${analBeads}')`;

    return (
        <div className={'pipe'} style={{ left }}>
            <div className={'pipe-top'} style={{ bottom, backgroundImage }} />
            <div className={'pipe-bottom'} style={{ top, backgroundImage }} />
        </div>
    )
}

const Pipes = ({ pipes }) => {
    return (
        <div className={'pipes-container'}>
            { pipes.map(renderPipe) }
        </div>
    )
}

export default Pipes;