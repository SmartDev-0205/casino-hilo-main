const axios = require("axios");
const rand = require("random-seed").create();
require("dotenv").config();

// Users List
const usersPoints = {};

const Rule = {
    Numbers: [0, 1, 2, 3, 4, 5, 6, 7],
    JQKA: [8, 9, 10, 11],
    JQ: [8, 9],
    KA: [10, 11],
};

const CreateRandomNumber = async (user) => {
    user.previousCardNum = user.newCardNum;
    user.previousColorNum = user.newColorNum;

    var newCardRandomNum = rand.intBetween(0, 12);
    user.newCardNum = newCardRandomNum;

    var newColorRandomNum = rand.intBetween(0, 1);
    // 0 = Red, 1 = Black
    user.newColorNum = newColorRandomNum;
};

const CalcResult = async (user) => {
    var preCDNum = user.previousCardNum;
    var newCDNum = user.newCardNum;
    var newCONum = user.newColorNum;
    var position = Number(user.betPosition);
    var bet = user.betBalance;
    var money = 0;
    switch (position) {
        case 0: //High
            if (newCDNum > preCDNum) {
                switch (preCDNum) {
                    case 0:
                        money = bet * 1.09;
                        break;
                    case 1:
                        money = bet * 1.2;
                        break;
                    case 2:
                        money = bet * 1.33;
                        break;
                    case 3:
                        money = bet * 1.5;
                        break;
                    case 4:
                        money = bet * 1.71;
                        break;
                    case 5:
                        money = bet * 2;
                        break;
                    case 6:
                        money = bet * 2.4;
                        break;
                    case 7:
                        money = bet * 3;
                        break;
                    case 8:
                        money = bet * 4;
                        break;
                    case 9:
                        money = bet * 6;
                        break;
                    case 10:
                        money = bet * 12;
                        break;
                }
            }
            break;
        case 1: //Low
            if (newCDNum < preCDNum) {
                switch (preCDNum) {
                    case 1:
                        money = bet * 12;
                        break;
                    case 2:
                        money = bet * 6;
                        break;
                    case 3:
                        money = bet * 4;
                        break;
                    case 4:
                        money = bet * 3;
                        break;
                    case 5:
                        money = bet * 2.4;
                        break;
                    case 6:
                        money = bet * 2;
                        break;
                    case 7:
                        money = bet * 1.71;
                        break;
                    case 8:
                        money = bet * 1.5;
                        break;
                    case 9:
                        money = bet * 1.33;
                        break;
                    case 10:
                        money = bet * 1.2;
                        break;
                    case 11:
                        money = bet * 1.09;
                        break;
                }
            }
            break;
        case 2: //Joker
            if (newCDNum === 12) money = bet * 24;
            break;
        case 3: //Red
            if (newCONum === 0) money = bet * 2;
            break;
        case 4: //Black
            if (newCONum === 1) money = bet * 2;
            break;
        case 5: //Numbers
            if (Rule.Numbers.indexOf(newCDNum) !== -1) money = bet * 1.5;
            break;
        case 6: //JQKA
            if (Rule.JQKA.indexOf(newCDNum) !== -1) money = bet * 3;
            break;
        case 7: //JQ
            if (Rule.JQ.indexOf(newCDNum) !== -1) money = bet * 6;
            break;
        case 8: //KA
            if (Rule.KA.indexOf(newCDNum) !== -1) money = bet * 6;
            break;
    }
    user.totalMoney = money;
};

module.exports = {
    StartSignal: async (req, res) => {
        try {
            const { token, betValue } = req.body;

            console.log("BetBalance: ", betValue);

            let user = usersPoints[token];
            if (user === undefined) {
                usersPoints[token] = {
                    totalMoney: 0,
                    betBalance: 0,
                    betPosition: 0,
                    previousCardNum: 0,
                    newCardNum: 0,
                    newColorNum: 0,
                    winlose: 0,
                };
                user = usersPoints[token];
            }
            user.betBalance = betValue;

            await CreateRandomNumber(user);

            if (token != "demo") {
                try {
                    await axios.post(
                        process.env.PLATFORM_SERVER + "api/games/bet",
                        {
                            token: token,
                            amount: user.betBalance,
                        }
                    );
                } catch (err) {
                    console.log(err);
                    throw new Error(err);
                }
            }

            res.json({
                status: true,
                cardNum: Number(user.newCardNum).toFixed(0),
                colorNum: user.newColorNum,
            });
        } catch (err) {
            console.log(err.message);
            res.json({
                status: false,
            });
        }
    },
    Gaming: async (req, res) => {
        try {
            const { token, betPosition } = req.body;

            console.log("Token: ", token, "\n", "BetPosition: ", betPosition);

            let user = usersPoints[token];
            user.betPosition = betPosition;

            await CreateRandomNumber(user);
            await CalcResult(user);

            if (user.totalMoney === 0) {
                if (token != "demo") {
                    try {
                        await axios.post(
                            process.env.PLATFORM_SERVER + "api/games/winlose",
                            {
                                token: token,
                                amount: 0,
                                winState: false,
                            }
                        );
                    } catch (err) {
                        throw new Error(err);
                    }
                }
                user.betBalance = 0;

                res.json({
                    status: true,
                    gameStatus: false,
                    cardNum: user.newCardNum,
                    colorNum: user.newColorNum,
                });
            } else {
                user.betBalance = user.totalMoney;

                res.json({
                    status: true,
                    gameStatus: true,
                    cardNum: user.newCardNum,
                    colorNum: user.newColorNum,
                    moneyResult: user.totalMoney,
                });
            }

            user.totalMoney = 0;
        } catch (err) {
            console.log(err.message);
            res.json({
                status: false,
            });
        }
    },
    CashOut: async (req, res) => {
        try {
            const { token } = req.body;

            let user = usersPoints[token];
            if (token != "demo") {
                try {
                    await axios.post(
                        process.env.PLATFORM_SERVER + "api/games/winlose",
                        {
                            token: token,
                            amount: user.betBalance,
                            winState: true,
                        }
                    );
                } catch (err) {
                    throw new Error(err);
                }
            }

            console.log("Token: ", token, "\n", "CashOut: ", user.betBalance);

            res.json({
                status: true,
                moneyResult: user.betBalance,
            });

            user.betBalance = 0;
            user.totalMoney = 0;
        } catch (err) {
            console.log(err.message);
            res.json({
                status: false,
            });
        }
    },
};
