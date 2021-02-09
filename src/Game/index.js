import React, {Component} from 'react'
import {ReadingsContext} from "@maustec/react-edge-o-matic";
import './index.css'
import Pipes from "./Pipes";
import Bird from "./Bird";
import backgroundImage from '../assets/assy-background.png'
import VibratorSearchButton from "../Buttplug/VibratorSearchButton";
import VibratorControls from "../Buttplug/VibratorControls";

/**
 * This is Flappy Bird.
 * In React.
 * But played with your ass.
 *
 * What more do you expect?
 */
class Game extends Component {
    /**
     * Primary control comes from the Edge-o-Matic. This context provides raw data.
     */
    static contextType = ReadingsContext;

    /**
     * Game FPS. Increase for sadness.
     * @type {number}
     */
    FPS = 30;

    /**
     * The rightmost position of the bird on screen, in percent.
     * @type {number}
     */
    BirdRight = 15;

    /**
     * Calculations ramp up to "max" over this many points. Anything higher than this is a limit break.
     * (I don't know what'll happen.)
     * @type {number}
     */
    MaxScore = 20;

    /**
     * This is the rate at which your bird falls. Also known as "gravity". Your bird drops (1-this)% per frame.
     * @type {number}
     */
    DecayCoefficient = 0.98;

    /**
     * This is how high your bird flaps, in percent, per flappy flap.
     * @type {number}
     */
    FlapAmount = 20;

    /**
     * Increasing this adds some wiggle room around pipes. This game was meant to be played with your anus, which is
     * arguably not a very accurate game controller. That's probably why most game systems use your fingers instead.
     * @type {number}
     */
    PipeCollisionThreshold = 1;

    constructor(props) {
        super(props);

        this.defaultState = {
            /**
             * Signal that a game has begun.
             */
            started: false,

            /**
             * Signal that the bird somehow crashed. Or we won?
             */
            gameOver: false,

            /**
             * This signals that the bird crashed, specifically. It's mostly to load the right
             * game over graphics.
             */
            crashed: false,

            /**
             * This is almost deprecated, but we don't start the game until you flap for the first time.
             */
            birdCaptured: false,

            /**
             * This is how many jolly walls of anal beads you have launched your poor flapping buttplug through.
             */
            score: 0,

            /**
             * This goes from 1 to 2 and above, and is a speed multiplier.
             */
            speed: 1,

            /**
             * This is just a timestamp in the game. It's how many frames have elapsed since it started.
             */
            ticks: 0,

            /**
             * Height of the bird, in percent. I think this is the bottom of the bird, yeah.
             */
            birdHeight: 0,

            /**
             * Bird Height and Virtual Arousal are related. This is almost deprecated, since arousal was the first
             * metric from the Edgeo-o-Matic that we used for bird altitude.
             */
            virtualArousal: 50,

            /**
             * @ignore
             */
            konami: false,

            /**
             * @ignore
             */
            konamiIndex: 0,

            /**
             * List of pipes. They're not really pipes, they're bright pink anal beads. But then again, it's not really
             * a bird, now is it?
             */
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

    /**
     * Hack to focus the playfield so our spacebar can space, bar.
     */
    componentDidMount() {
        if (this.playfield) {
            this.playfield.focus();
        }
    }

    /**
     * This starts a new game. It resets the state, and begins the loop timer.
     */
    startGame() {
        this.setState({...this.defaultState, started: true});
        this.lastPipeRender = 0;
        this.tickInterval = setInterval(this.tick, 1000 / this.FPS);
    }

    /**
     * This ends the game. Useful if your buttplug slammed into a wall.
     * @param addtlState
     */
    endGame(addtlState = {}) {
        this.setState({gameOver: true, ...addtlState});
        clearInterval(this.tickInterval);
    }

    /**
     * Adds a fresh new set of anal beads to guide your little adventurer through.
     */
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

    /**
     * Removes pipes which are no longer on screen.
     */
    removePipes() {
        this.setState({
            pipes: this.state.pipes.filter(p => p.position > 0)
        });
    }

    /**
     * Moves pipes [actually anal beads] over by a set amount.
     * @param speed
     */
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

    /**
     * This calculates the height of the bird based on arousal, and whether or not we have indeed captured the bird.
     * It's not accurate to what is on screen, since the CSS animation smoothing stuff.
     * @see calculateActualBirdHeight
     * @returns {number}
     */
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

    /**
     * This calculates the actual height of the bird, in percent. This is necessary to adjust for any CSS animations
     * that happen, since the bird movement is smoothed by CSS and not JavaScript. Cool, huh?
     * @returns {number}
     */
    calculateActualBirdHeight() {
        if (!this.playfield || !this.birdRef) {
            return 50;
        }

        const playField = this.playfield.getBoundingClientRect()
        const birdBox = this.birdRef.getBoundingClientRect()

        const birdMid = birdBox.bottom;// - (birdBox.height / 2);
        return Math.floor(((playField.height - birdMid) / playField.height) * 100)
    }

    /**
     * All of this determines if your buttplug crashed into anal beads.
     * There's some math here, because I chose to store all the values in percents so I have to translate it back to
     * window size. This also means you can play flappy bird with your asshole while an asshole resizes the window
     * constantly.
     */
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

    /**
     * This is the main game loop, which adds pipes, shifts pipes, calculates collision with pipes.
     * You know. Game loop stuff.
     */
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

    /**
     * Event bind to pass to startGame
     * @param e
     */
    handleStartClick(e) {
        e.preventDefault();
        this.startGame();
    }

    /**
     * Here there be flappin'
     * @param e
     */
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