const express = require("express");
const app = express();
const server = require("http").Server(app);
console.log(server);
const {v4: uuidv4} = require("uuid");
const io = require("socket.io")(server);
const db = require("./config/db");
const User = require("./model/User");
db.connect();

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);
app.use(express.json());

app.post("/auth/register", async (req, res) =>{
    try {
        const {name, password} = req.body;
        if (!name) throw new Error("User name can not be empty");
        if (!password) throw new Error("Password can not be empty");
        const check = await User.findOne({name: name});
        if (check) throw new Error("Username already exists");
        const user = new User({
            name: name,
            password: password
        });
        const userObject = await user.save();
        const response = {
            status: 1,
            message: "registration succeed",
            user: userObject,
        }
        res.json(response);
    } catch (err) {
        res.send({
            status: 0,
            message: err.message,
        });
    }
});

app.post("/auth/login", async (req, res) =>{
    try {
        const {name, password} = req.body;
        if (!name) throw new Error("User name can not be empty");
        if (!password) throw new Error("Password can not be empty");
        const user = await User.findOne({name: name});
        if (!user) throw new Error("Username incorrect");
        if (user.password != password) throw new Error("Password Incorrect");
        const userObject = await user.save();
        const response = {
            status: 1,
            message: "login succeed",
            user,
        }
        res.json(response);
    } catch (err) {
        res.send({
            status: 0,
            message: err.message,
        });
    }
});

app.get("/", (req, res) => {
    res.redirect("/login");
});

app.get("/:room", (req, res) => {
    res.render("room",  {roomId: req.params.room});
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        console.log(roomId, userId);
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);
    });
});

server.listen(8080, ()=>{
    console.log("app is listening to port 8080")
})