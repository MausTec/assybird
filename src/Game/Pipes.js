import React from 'react'

const renderPipe = (pipe) => {
    const left = pipe.position + '%';
    const bottom = (pipe.height + (pipe.gap / 2)) + '%'
    const top = 100 - (pipe.height - (pipe.gap / 2)) + '%'

    return (
        <div className={'pipe'} style={{ left }}>
            <div className={'pipe-top'} style={{ bottom }} />
            <div className={'pipe-bottom'} style={{ top }} />
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