const express = require("express");
const router = express.Router();
const User = require("./api_controller");

module.exports = (router) => {
    // User API
    router.post("/start-signal", User.StartSignal);
    router.post("/start-game", User.Gaming);
    router.post("/start-cashout", User.CashOut);
};
