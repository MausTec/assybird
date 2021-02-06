import React, {useEffect, useRef, useState} from 'react'
import risingBird from '../assets/assy-blow.png'
import fallingBird from '../assets/assy-drift.png'
import deadBird from '../assets/assy-dead.png'
import flatBird from '../assets/assy-go-smash.png'

let floatTimer = null;

const Bird = ({ height, idle, dead, splat }) => {
    const bottom = height + "%";
    const [rising, setRising] = useState(false);
    const prevHeight = useRef(height);

    useEffect(() => {
        if (height > prevHeight.current) {
            setRising(true);

            if (floatTimer) {
                clearTimeout(floatTimer);
            }

            floatTimer = setTimeout(() => {
                setRising(false);
            }, 300);
        }

        prevHeight.current = height;
    }, [height]);

    return (
        <div className={'bird' + (idle ? ' idle' : ' zooming')} style={{ bottom }}>
            <img src={splat ? flatBird : dead ? deadBird : rising ? risingBird : fallingBird} width={60} height={148} />
        </div>
    )
}

export default Bird;