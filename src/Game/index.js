import React, {Component} from 'react'
import {ReadingsContext} from "@maustec/react-edge-o-matic";
import './index.css'
import Pipes from "./Pipes";
import Bird from "./Bird";
import backgroundImage from '../assets/assy-background.png'
import VibratorSearchButton from "../Buttplug/VibratorSearchButton";
import VibratorControls from "../Buttplug/VibratorControls";

class Game extends Component {
    static contextType = ReadingsContext;
    FPS = 30;
    BirdRight = 15;
    MaxScore = 20;
    DecayCoefficient = 0.98;
    FlapAmount = 20;
    PipeCollisionThreshold = 1;

    constructor(props) {
        super(props);

        this.defaultState = {
            started: false,
            gameOver: false,
            crashed: false,
            birdCaptured: false,
            score: 0,
            speed: 1,
            ticks: 0,
            birdHeight: 0,
            virtualArousal: 50,
            konami: false,
            konamiIndex: 0,
            pipes: []
        }

        this.state = {...this.defaultState}

        this.tickInterval = null;
        this.playfield = null;
        this.lastPipeRender = 0;
        this.birdRef = null;

        this.handleStartClick = this.handleStartClick.bind(this);
        this.tick = this.tick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    componentDidMount() {
        if (this.playfield) {
            this.playfield.focus();
        }
    }

    startGame() {
        this.setState({...this.defaultState, started: true});
        this.lastPipeRender = 0;
        this.tickInterval = setInterval(this.tick, 1000 / this.FPS);
    }

    endGame(addtlState = {}) {
        this.setState({gameOver: true, ...addtlState});
        clearInterval(this.tickInterval);
    }

    addPipe() {
        const {speed, ticks} = this.state;
        const gap = (this.MaxScore - speed) + Math.floor(Math.random() * ((this.MaxScore / 2) - speed));
        const height = 50 + Math.floor(25 - (Math.random() * 50));

        let pipe = {
            id: ticks,
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
            p.lastPosition = p.position;
            p.position -= speed;
        })

        this.setState({
            pipes
        })
    }

    calculateBirdHeight() {
        const {arousalLimit, offlineMode} = this.props
        let height;

        if (offlineMode) {
            height = this.state.virtualArousal;
        } else {
            const {lastReading} = this.context
            const {arousal} = lastReading
            height = Math.floor((arousal / arousalLimit) * 100)

        }

        if (!this.state.birdCaptured) {
            if (height > 50) {
                this.setState({birdCaptured: true});
            } else {
                return 50;
            }
        }

        return height;
    }

    calculateActualBirdHeight() {
        if (!this.playfield || !this.birdRef) {
            return 50;
        }

        const playField = this.playfield.getBoundingClientRect()
        const birdBox = this.birdRef.getBoundingClientRect()

        const birdMid = birdBox.bottom;// - (birdBox.height / 2);
        return Math.floor(((playField.height - birdMid) / playField.height) * 100)
    }

    calculateCollision() {
        const height = this.calculateActualBirdHeight();
        const playfieldHeight = (this.playfield && this.playfield.getBoundingClientRect().height) || 100;
        const _this = this;

        if (height >= 100 || height <= 0) {
            this.endGame({
                birdHeight: 0.1
            });
        }

        const pipes = this.state.pipes.filter(pipe => (
            pipe.lastPosition > this.BirdRight && pipe.position <= this.BirdRight
        ));

        const birdTop = (((height + this.PipeCollisionThreshold) / 100) * playfieldHeight) + 30;
        const birdBottom = (((height - this.PipeCollisionThreshold) / 100) * playfieldHeight) - 30;

        pipes.forEach(pipe => {
            const pipeTop = ((pipe.height + (pipe.gap / 2)) / 100) * playfieldHeight;
            const pipeBottom = ((pipe.height - (pipe.gap / 2)) / 100) * playfieldHeight;

            if (birdTop > pipeTop || birdBottom < pipeBottom) {
                _this.endGame({
                    birdHeight: height,
                    crashed: true
                });
            } else {
                const score = _this.state.score + 1;
                const speed = Math.max(1, Math.min(1 + (score / this.MaxScore), 2));
                _this.setState({score, speed});
            }
        })
    }

    tick() {
        const ticks = this.state.ticks + 1;
        let virtualArousal = this.state.virtualArousal;

        this.shiftPipes(this.state.speed);
        this.removePipes();

        const pipeRenderInterval = Math.floor(this.FPS / (this.state.speed * 0.5))
        if (ticks - this.lastPipeRender > pipeRenderInterval) {
            this.lastPipeRender = ticks;
            this.state.birdCaptured && this.addPipe();
        }

        if (this.props.offlineMode) {
            this.playfield && this.playfield.focus();
            if (this.state.birdCaptured) {
                virtualArousal = Math.floor(virtualArousal * this.DecayCoefficient);
            }
        }

        this.calculateCollision();
        this.setState({ticks, virtualArousal});
    }

    handleStartClick(e) {
        e.preventDefault();
        this.startGame();
    }

    handleKeyDown(e) {
        const konami = [
            38, 38,
            40, 40,
            37, 39,
            37, 39,
            66, 65,
            13
        ]

        if (e.keyCode === konami[this.state.konamiIndex]) {
            console.log("Great!", e.keyCode);
            if (this.state.konamiIndex >= konami.length - 1) {
                alert('the fuck you want, a cookie?')
                this.setState({konamiIndex: 0, konami: true});
            } else {
                this.setState({konamiIndex: this.state.konamiIndex + 1});
            }
        } else {
            if (this.state.konamiIndex > 0) {
                this.setState({konamiIndex: 0});
            }
        }

        if (!this.props.offlineMode) return;

        // Space Bar
        if (e.keyCode === 32) {
            e.preventDefault();
            if (!this.state.flapDown) {
                let {virtualArousal} = this.state;
                virtualArousal += (this.FlapAmount * this.state.speed);
                this.setState({virtualArousal})
            }
        }
    }

    render() {
        const {lastReading} = this.context
        const birdHeight = this.state.started ? (this.state.birdHeight || this.calculateBirdHeight()) : 50;
        const background = `url(${backgroundImage}) -${this.state.ticks * 2}px center, linear-gradient(315deg, #d9e4f5 0%, #f5e3e6 74%)`

        return (
            <main ref={r => this.playfield = r}
                  className={'game-area'}
                  tabIndex={0}
                  onKeyDown={this.handleKeyDown}
                  style={{ opacity: 1 - (this.state.konamiIndex * 0.04), background }}
            >
                {this.state.konami && <pre className={'debug'}>
                    {JSON.stringify(lastReading, undefined, 2)}
                    <br/>
                    {JSON.stringify({...this.state, props: this.props}, undefined, 2)}
                </pre>}

                <Pipes pipes={this.state.pipes}/>
                <Bird height={birdHeight}
                      innerRef={r => this.birdRef = r}
                      idle={!this.state.started}
                      splat={this.state.crashed}
                      speed={this.state.speed}
                      dead={this.state.gameOver}/>

                { this.state.konami && <div className={'bird bird-debug'} style={{ bottom: `${this.calculateActualBirdHeight()}%` }} /> }

                {this.state.started && <div className={'scoreboard'}>
                    <div className={'score'}>Score: {this.state.score}</div>
                    <div className={'speed'}>Speed: {this.state.speed}</div>
                </div>}

                {this.state.gameOver && <div className={'game-over'}>
                    <div>Game Over :(</div>
                    <button type={'button'} onClick={this.handleStartClick}>Start!</button>
                </div>}
                {!this.state.started && <div className={'game-over'}>
                    <button type={'button'} onClick={this.handleStartClick}>Start!</button>
                </div>}

                <VibratorSearchButton />
                <VibratorControls speed={this.state.gameOver ? 0 : (this.state.speed - 1) / 2} />
            </main>
        )
    }
}

export default Game