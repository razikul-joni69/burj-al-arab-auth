const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");
const admin = require("firebase-admin");
require('dotenv').config()

const port = 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/burj-al-arab-b52d3-firebase-adminsdk-uumhf-0bd0b750a8.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const password = "@razikul";
const MongoClient = require("mongodb").MongoClient;
const uri =
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v0ilw.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
client.connect((err) => {
    const bookings = client.db("burjAlArab").collection("bookings");
    // console.log("db connected successfully");

    app.post("/addBooking", (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking).then((result) => {
            res.send(result.insertedCount > 0);
        });
        console.log(newBooking);
    });

    app.get("/bookings", (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith("Bearer ")) {
            const idToken = bearer.split(" ")[1];
            // idToken comes from the client app
            admin
                .auth()
                .verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        bookings
                            .find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            });
                    } else {
                        res.status(401).send("Unauthorised Access");
                    }
                })

                .catch((error) => {
                    res.status(401).send("Unauthorised Access");
                });
        } else {
            res.status(401).send("Unauthorised Access");
        }
    });
});

app.get("/", (req, res) => {
    res.send("Hello, Welcome to jonis world");
});

app.listen(port, () => {
    // console.log("listening on port 5000");
});
