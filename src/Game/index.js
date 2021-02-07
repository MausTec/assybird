import React, {Component} from 'react'
import {ReadingsContext} from "@maustec/react-edge-o-matic";
import './index.css'
import Pipes from "./Pipes";
import Bird from "./Bird";

class Game extends Component {
    static contextType = ReadingsContext;
    FPS = 30;
    BirdRight = 15;
    MaxScore = 20;
    DecayCoefficient = 0.98;
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
        const gap = (20 - speed) + Math.floor(Math.random() * (10 - speed));
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

    calculateCollision() {
        const height = this.calculateBirdHeight();
        const _this = this;

        if (height >= 100 || height <= 0) {
            this.endGame({
                birdHeight: 0.1
            });
        }

        const pipes = this.state.pipes.filter(pipe => (
            pipe.lastPosition > this.BirdRight && pipe.position <= this.BirdRight
        ));

        pipes.forEach(pipe => {
            if (Math.abs(height - pipe.height) > (pipe.gap / 2)) {
                _this.endGame({
                    birdHeight: height,
                    crashed: true
                });
            } else {
                const score = _this.state.score + 1;
                const speed = Math.max(1, Math.min(1 + (score / 20), 2));
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
                virtualArousal = Math.floor(virtualArousal * 0.98);
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
                virtualArousal += (20 * this.state.speed);
                this.setState({virtualArousal})
            }
        }
    }

    render() {
        const {lastReading} = this.context
        const birdHeight = this.state.started ? (this.state.birdHeight || this.calculateBirdHeight()) : 50;

        return (
            <main ref={r => this.playfield = r}
                  className={'game-area'}
                  tabIndex={0}
                  onKeyDown={this.handleKeyDown}
                  style={{ opacity: 1 - (this.state.konamiIndex * 0.04) }}
            >
                {this.state.konami && <pre className={'debug'}>
                {JSON.stringify(lastReading, undefined, 2)}
                    <br/>
                    {JSON.stringify({...this.state, props: this.props}, undefined, 2)}
            </pre>}

                <Pipes pipes={this.state.pipes}/>
                <Bird height={birdHeight}
                      idle={!this.state.started}
                      splat={this.state.crashed}
                      dead={this.state.gameOver}/>

                {this.state.started && <div className={'scoreboard'}>
                    <div className={'score'}>Score: {this.state.score}</div>
                    <div className={'speed'}>Speed: {this.state.speed}</div>
                </div>}

                {this.state.gameOver && <div className={'game-over'}>
                    <div>Game Over :(</div>
                    <a href={'#'} onClick={this.handleStartClick}>Start!</a>
                </div>}
                {!this.state.started && <a href={'#'} onClick={this.handleStartClick}>Start!</a>}
            </main>
        )
    }
}

export default Game