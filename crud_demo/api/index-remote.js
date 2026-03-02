// This file is saved inside the 'api' folder.

const express = require("express");
const { MongoClient } = require("mongodb");
const dns = require("dns");
const cors = require("cors");
const multer = require("multer");

// Force Node to use reliable DNS (helps when Node resolver differs from nslookup)
dns.setServers(["1.1.1.1", "1.0.0.1"]);

const app = express();
app.use(cors());

// Atlas → Connect → Drivers → Standard connection string
// Paste it here EXACTLY, including the correct replicaSet value.
const CONNECTION_STRING =
  "mongodb+srv://username:password@cluster0.jaheaoh.mongodb.net/?appName=Cluster0";

const DATABASENAME = "MyDb";
let database;

// Guard middleware (prevents using routes before DB is ready)
app.use((req, res, next) => {
  if (!database) {
    return res.status(503).json({ error: "Database not connected yet." });
  }
  next();
});

console.log("Starting API...");
console.log("Connecting to MongoDB...");

async function start() {
  try {
    // Create client with timeouts so you see errors quickly
    const client = new MongoClient(CONNECTION_STRING, {
      serverSelectionTimeoutMS: 10000, // 10s
      connectTimeoutMS: 10000,
    });

    await client.connect();

    database = client.db(DATABASENAME);
    console.log("Yay! Now connected to Cluster");

    app.listen(5038, () => {
      console.log("Server running on http://localhost:5038");
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

start();

// ROUTES TO ALL ACTIONS

// Get all books
app.get("/api/books/GetBooks", async (req, res) => {
  try {
    const result = await database.collection("books").find({}).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Add book
app.post("/api/books/AddBook", multer().none(), async (req, res) => {
  try {
    const numOfDocs = await database.collection("books").countDocuments();

    await database.collection("books").insertOne({
      id: String(numOfDocs + 1),
      title: req.body.title,
      desc: req.body.description,          // <-- from Angular formData.append("description", ...)
      price: Number(req.body.price) || 0,  // <-- from Angular formData.append("price", ...)
    });

    res.json("Added Successfully");
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ error: "Failed to add book" });
  }
});

// Delete book
app.delete("/api/books/DeleteBook", async (req, res) => {
  try {
    await database.collection("books").deleteOne({ id: req.query.id });
    res.json("Deleted successfully!");
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Failed to delete book" });
  }
});


