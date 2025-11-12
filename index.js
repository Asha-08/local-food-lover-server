const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.us9qyhi.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("local-food-lover-db");
    const reviewCollection = db.collection("reviews");

    const favoriteCollection = db.collection("favorites");

    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    // feature review

    app.get("/featured-reviews", async (req, res) => {
      const cursor = reviewCollection.find().sort({ rating: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    // my reviews

    app.get("/my-reviews", async (req, res) => {
      const email = req.query.email;
      const result = await reviewCollection
        .find({ created_by: email })
        .toArray();
      res.send(result);
    });

    // post method

    app.post("/reviews", async (req, res) => {
      const data = req.body;
      // console.log(data)
      const result = await reviewCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    // put
    // update one

    app.put("/reviews/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      // console.log(id)
      // console.log(data)
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const update = {
        $set: data,
      };
      const result = await reviewCollection.updateOne(filter, update);

      res.send({
        success: true,
        result,
      });
    });

    // delete
    // delete one

    app.delete("/reviews/:id", async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };

      const result = await reviewCollection.deleteOne(filter);

      res.send({
        success: true,
        result,
      });
    });

    // search

    app.get("/search", async (req, res) => {
      const search_text = req.query.search;
      const query = {
        foodName: { $regex: search_text, $options: "i" },
      };
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    // favorites system
    // add to favorites
    app.post("/favorites", async (req, res) => {
      try {
        const { reviewId, userEmail } = req.body;
        if (!reviewId || !userEmail) {
          return res
            .status(400)
            .send({ success: false, message: "Missing reviewId or userEmail" });
        }

        const doc = {
          reviewId,
          userEmail,
          createdAt: new Date(),
        };

        // prevent duplicates
        const exists = await favoriteCollection.findOne({
          reviewId,
          userEmail,
        });
        if (exists) {
          return res
            .status(200)
            .send({ success: true, message: "Already in favorites" });
        }

        const result = await favoriteCollection.insertOne(doc);
        res.status(201).send({ success: true, result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    // ✅ Get all favorites for the current user
    app.get("/favorites", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res
            .status(400)
            .send({ success: false, message: "Missing user email" });
        }

        // Find favorite entries for this user
        const favorites = await favoriteCollection
          .find({ userEmail: email })
          .toArray();

        // extract all review IDs
        const reviewIds = favorites.map((f) => new ObjectId(f.reviewId));

        // get matching review details from reviews collection
        const reviews = await reviewCollection
          .find({ _id: { $in: reviewIds } })
          .toArray();

        res.status(200).send({ success: true, reviews,favorites });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    // ✅ Remove from favorites
    app.delete("/favorites/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await favoriteCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Favorite not found" });
        }

        res
          .status(200)
          .send({ success: true, message: "Removed from favorites" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
