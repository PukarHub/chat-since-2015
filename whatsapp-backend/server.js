// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;      

// pusher
const pusher = new Pusher({
  appId: "1086961",
  key: "b5f9a1483a7d32119c96",
  secret: "909751bed44fdde7a8a6",
  cluster: "ap2",
  encrypted: true,
});

// middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url =
  "mongodb+srv://pukar123:pukar123@cluster0.lhram.mongodb.net/pukar123?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB Connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A change occured", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp : messageDetails.timestamp,
        received : messageDetails.received,
      });
    } else {
      console.log("Error Triggering Pusher");
    }
  });
});

// api routes
app.get("/", (req, res) => res.status(200).send("Hello mf"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.status(201).send(data);
    }
  });
});
   
// Listen
app.listen(port, () => console.log(`Working bruh: ${port}`));   
 