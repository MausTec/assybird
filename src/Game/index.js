import React, {Component} from 'react'
import {ReadingsContext} from "@maustec/react-edge-o-matic";
import './index.css'
import Pipes from "./Pipes";
import Bird from "./Bird";

class Game extends Component {
    static contextType = ReadingsContext;
    FPS = 30;
    BirdRight = 15;
    PipeCollisionThreshold = 1;

    constructor(props) {
        super(props);

        this.state = {
            score: 0,
            speed: 1,
            ticks: 0,
            birdHeight: 0,
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
            birdHeight: 0,
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

    calculateBirdHeight() {
        const { lastReading } = this.context
        const { arousalLimit } = this.props
        const { arousal } = lastReading

        return Math.floor((arousal / arousalLimit) * 100)
    }

    calculateCollision() {
        const height = this.calculateBirdHeight();
        const _this = this;

        const pipes = this.state.pipes.filter(pipe => (
            this.BirdRight - pipe.position === 0
        ));

        pipes.forEach(pipe => {
            if (Math.abs(height - pipe.height) > (pipe.gap / 2)) {
                _this.setState({
                    birdHeight: height
                });
                _this.endGame();
            } else {
                const score = _this.state.score + 1;
                const speed = Math.max(1, Math.min(Math.ceil(score / 10), 15));
                _this.setState({ score, speed });
            }
        })
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
        const birdHeight = this.state.birdHeight || this.calculateBirdHeight()

        return (<main className={'game-area'}>
            <pre className={'debug'}>
                { JSON.stringify(lastReading, undefined, 2) }
                <br />
                { JSON.stringify({...this.state, props: this.props}, undefined, 2) }
            </pre>

            <Pipes pipes={this.state.pipes} />
            <Bird height={birdHeight} />

            { this.state.started && <div className={'scoreboard'}>
                <div className={'score'}>Score: { this.state.score }</div>
                <div className={'speed'}>Speed: { this.state.speed }</div>
            </div> }
            { !this.state.started && <a href={'#'} onClick={this.handleStartClick}>Start!</a> }
        </main>)
    }
}

export default Game