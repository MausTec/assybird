import React, {Component} from 'react'
import {ReadingsContext} from "@maustec/react-edge-o-matic";
import './index.css'
import Pipes from "./Pipes";
import Bird from "./Bird";

class Game extends Component {
    static contextType = ReadingsContext;
    FPS = 30;

    constructor(props) {
        super(props);

        this.state = {
            score: 0,
            speed: 1,
            ticks: 0,
            pipes: []
        }

        this.tickInterval = null;

        this.handleStartClick = this.handleStartClick.bind(this);
        this.tick = this.tick.bind(this);
    }

    startGame() {
        this.setState({
            started: true,
            speed: 1,
            score: 0,
            ticks: 0,
            pipes: []
        });

        this.tickInterval = setInterval(this.tick, 1000 / this.FPS);
    }

    endGame() {
        this.setState({ started: false });
        clearInterval(this.tickInterval);
    }

    addPipe() {
        const { speed } = this.state;
        const gap = (20 - speed) + Math.floor(Math.random() * (10 - speed));
        const height = 50 + Math.floor(25 - (Math.random() * 50));

        let pipe = {
            height,
            gap,
            position: 100,
        }

        this.setState({
            pipes: [...this.state.pipes, pipe]
        })
    }

    removePipes() {
        this.setState({
            pipes: this.state.pipes.filter(p => p.position > 0)
        });
    }

    shiftPipes(speed) {
        let pipes = [...this.state.pipes];

        pipes.forEach(p => {
            p.position -= speed;
        })

        this.setState({
            pipes
        })
    }

    calculateCollision() {

    }

    tick() {
        const ticks = this.state.ticks + 1;

        this.shiftPipes(this.state.speed);
        this.removePipes();

        if (ticks % Math.floor(this.FPS / (this.state.speed * 0.5)) === 0) {
            this.addPipe();
        }

        this.calculateCollision();

        this.setState({ticks});
    }

    handleStartClick(e) {
        e.preventDefault();
        this.startGame();
    }

    render() {
        const { lastReading } = this.context
        const { arousalLimit } = this.props
        const { arousal } = lastReading
        const birdHeight = Math.floor((arousal / arousalLimit) * 100)

        return (<main className={'game-area'}>
            <pre className={'debug'}>
                { JSON.stringify(lastReading, undefined, 2) }
                <br />
                { JSON.stringify({...this.state, props: this.props}, undefined, 2) }
            </pre>

            <Pipes pipes={this.state.pipes} />
            <Bird height={birdHeight} />

            { !this.state.started && <a href={'#'} onClick={this.handleStartClick}>Start!</a> }
        </main>)
    }
}

export default Game