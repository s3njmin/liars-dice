import React, {useState, useEffect} from 'react';
import "./Game.css";
import dice1 from "../images/dice1.png";
import dice2 from "../images/dice2.png";
import dice3 from "../images/dice3.png";
import dice4 from "../images/dice4.png";
import dice5 from "../images/dice5.png";
import dice6 from "../images/dice6.png";
import blankDice from "../images/blankDice.png";

const diceImg = [dice1, dice2, dice3, dice4, dice5, dice6]

function product_Range(a, b) {
    let prd = a
    let i = a;
   
    while (i++ < b) {
        prd *= i;
    }
    return prd;
}
  
function combinations(n, r) 
{
    if (n == r || r == 0) {
        return 1;
    } else {
        r = (r < n - r) ? n - r : r;
        return product_Range(r + 1, n)/ product_Range(1, n - r);
    }
}

const checkCount = (dices) => {
    let arr = [0, 0, 0, 0, 0, 0]

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            arr[dices[i][j] - 1]++
        }
        // console.log(" ")
    }

    return arr;
}

const rollDice = (dice) => {
    let arr = [];
    for (let i = 0; i < dice; i++) {
        let num = Math.floor(Math.random() * 6) + 1
        arr.push(num)
    }
    arr.sort()
    return arr;
}

function Game() {
    const [numDice, setNumDice] = useState([5, 5, 5, 5]);
    const [dice, setDice] = useState([
        rollDice(numDice[0]),
        rollDice(numDice[1]),
        rollDice(numDice[2]),
        rollDice(numDice[3])
    ])
    const [count, setCount] = useState(checkCount(dice));
    const [playerTurn, setTurn] = useState(1);
    const [bid, setBid] = useState([1, 0]);
    const [roundEnd, setRoundEnd] = useState(false)
    const [gameEnd, setGameEnd] = useState(false)

    function init(ended) {
        let numDice1 = numDice[0]
        let numDice2 = numDice[1]
        let numDice3 = numDice[2]
        let numDice4 = numDice[3]
        
        if (ended) {
            numDice1 = numDice2 = numDice3 = numDice4 = 5;
            setNumDice([5, 5, 5, 5])
            setGameEnd(false)
        }

        let newDice = [
            rollDice(numDice1),
            rollDice(numDice2),
            rollDice(numDice3),
            rollDice(numDice4)
        ]

        setDice(newDice)

        setCount(checkCount(newDice))
        setTurn(1)
        setBid([1, 0])
        setRoundEnd(false)
    }

    function findPrevPlayer (player) {
        let prevCnt = 0
        let curPlayer = player
        while (prevCnt == 0) {
            if (curPlayer == 1) {
                curPlayer = 4
            } else {
                curPlayer--
            }
            prevCnt = numDice[curPlayer - 1]
        }
        return curPlayer
    }

    function callLie (newBid, curTurn) {
        if (newBid[0] == 1 && newBid[1] == 0) {
            alert("no bids yet!")
            return;
        }

        console.log("Player " + curTurn + " calls a lie!")

        let loserIdx = curTurn - 1 //index of player who called the lie
        let prevPlayer = findPrevPlayer(curTurn)
        if (count[newBid[1] - 1] < newBid[0]) {
            alert("Player " + prevPlayer + " was lying!")
            loserIdx = prevPlayer - 1
        } else {
            alert("Player " + prevPlayer + " was telling the truth!")
        }

        setRoundEnd(true)
        numDice[loserIdx]--

        if (numDice[0] == 0) {
            alert("You've Lost!")
            setGameEnd(true)
        } else if (numDice[loserIdx] == 0) {
            alert("Player " + (loserIdx + 1) + " was eliminated!")
        }
    }

    // useEffect(() => {
    //     console.log(roundEnd)
    // }, [setRoundEnd])

    async function Simulate (prevBid) {
        function calcProb(bid, side, turn) {
            let N = 0
            let req = bid
            for (let i = 0; i < 4; i++) {
                if (i + 1 != turn) {
                    N += numDice[i]
                } else {
                    dice[i].forEach((val) => {
                        if (val == side) {
                            req--
                        }
                    })
                }
            }
            
            if (req <= 0) {
                return 100 //100% certain
            }

            let x = 1.0
            for (let i = 0; i < req; i++) {
                x -= combinations(N, i) * Math.pow((5 / 6), N - i) * Math.pow((1 / 6), i)
                // console.log(bid + "|" + side + "|" + i + "|" + combinations(N, i))
            }
            
            return Math.round(x * 100)
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        let newBid = [prevBid[0], prevBid[1]]
        for (let i = 2; i <= 4; i++) {
            //skip if player eliminated
            if (numDice[i - 1] == 0) {
                continue;
            }

            await sleep(2000); // wait 3 secs
            let high = [0, newBid[0], newBid[1]]
            for (let j = 1; j <= 6; j++) {
                let curSide = newBid[1] + j
                let curBid = newBid[0]
                if (curSide > 6) {
                    curSide -= 6
                    curBid++
                }
                
                let prob = calcProb(curBid, curSide, i)
                if (high[0] < prob) {
                    high = [prob, curBid, curSide]
                }
            }

            // if probability of prev bid < highest prob
            let prevProb = calcProb(newBid[0], newBid[1])
            console.log(prevProb + "|" + high[0])
            if (prevProb < 50 && high[0] < 70) {
                // console.log(prevProb + "|" + high[0])
                callLie(newBid, i)
                return
            } else {
                submitBid(high[1], high[2], i)
                newBid = [high[1], high[2]]
            } 
        }
    }

    function nextTurn (player) {
        if (player == 4) {
            return 1
        }
        return player + 1
    }

    function submitBid(i, j, pTurn) {
        const arr = [i, j]
        setBid(arr)

        let turn = nextTurn(pTurn)
        setTurn(turn)

        console.log("Player " + pTurn + " bids x" + i + " " + j)

        if (pTurn == 1) {
            Simulate(arr)
        }
    }

    function RenderBids () {
    //don't need props le
        let output = []
    
        for (let i = bid[0]; i <= 6; i++) {
            let x = (i == bid[0]) ? bid[1] + 1 : 1;
            for (let j = x; j <= 6; j++) {
                output.push(
                    <div className="DiceCount" key={i * 10 + j}>  
                            <img 
                                src={diceImg[j - 1]} 
                                width="50" 
                                key={i * 10 + j} 
                                onClick={() => submitBid(i, j, 1)}
                            />
                        <br></br> x{i}
                        {/* <br></br> {calcProb(i, j) + "%"} */}
                    </div>
                );
            }
        }
    
        return (
            <div>
            <div> {output} </div>
            </div>
        )
    }

    function DiceCount(props) {
        return (
            <div className="DiceCount">
                <img src={diceImg[props.i]} width="50"></img> 
                <br></br> x{props.cnt}
            </div>
        )
    }

    function RenderDice({idx}) {
        let hand = []
        let handInfo = (idx == 0) ? "Your Hand: " : "Player " + (+idx + +1) + "'s Hand: "
        hand.push(<h2> {handInfo} </h2>)

        dice[idx].map((roll) => (
            hand.push(<img src={diceImg[roll - 1]} width="50"></img>)
        ))
        return hand
    }

    function RenderCount() {
        let finalCount = []
        finalCount.push(<h2>Count:</h2>)
        let i = 0
        count.map((cnt) => {
            finalCount.push(
                <DiceCount i={i++} cnt={cnt}/>
            )
        })
        return finalCount
    }

    function AIHands() {
        let hands = []
        for (let i = 1; i < 4; i++) {
            hands.push( <h3>Player {i+1}</h3> )
            for (let j = 0; j < numDice[i]; j++) {
                hands.push(<img src={blankDice} width="20"/>)
            }
        }
        return hands
    }

    return (
        <div>
            <h1 className="Title"> Liar's Dice </h1>
            
            <div className="OtherHands">
                <AIHands className="blank-dice"/>
            </div>

            <div className="BidMsg">
                <h2> Previous Bid: &nbsp;
                {roundEnd &&
                    <button className="continueButton" onClick={() => init(gameEnd)}> {gameEnd ? "New Game" : "Continue"} </button>
                }
                </h2>
                
                {(bid[1] != 0) ?
                ( <div className="bid-log-parent">
                    <div className="bid-log-child"> 
                        <div> Player {(playerTurn == 1) ? 4 : playerTurn - 1} Bidded </div>
                        <DiceCount i={bid[1] - 1} cnt={bid[0]}/>
                    </div>
                    {roundEnd &&
                        <div className="bid-log-child"> 
                            <div> There Were </div>
                            <DiceCount i={bid[1] - 1} cnt={count[bid[1] - 1]}/>
                        </div>
                    }
                </div>) : (
                    <div> No Bids Yet </div>
                )}
            </div>

            <div className="Hands">
                <RenderDice idx="0"/>
                {roundEnd && 
                    <div>
                        <div>
                            <RenderDice idx="1"/>
                            <RenderDice idx="2"/>
                            <RenderDice idx="3"/>
                        </div>
                        <div>
                            <RenderCount/>
                        </div>
                    </div>
                }
            </div>

            <div className="RenderBids">
                {playerTurn == 1 && !roundEnd && 
                    <div> 
                        <h2> It's Your Turn! &nbsp;
                            <button onClick={() => callLie(bid, 1)}> That's a Lie ! </button>
                        </h2>
                        <RenderBids/>
                    </div>
                }
            </div>
        </div>
    )
}

export {Game}