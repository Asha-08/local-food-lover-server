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

    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    // feature review

    app.get("/featured-reviews", async (req, res) => {
      const cursor = reviewCollection.find().sort({rating:-1}).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/reviews/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await reviewCollection.findOne(query);
      res.send(result);
    })

    // my reviews

    app.get('/my-reviews',async(req,res)=>{
      const email = req.query.email;
      const result = await reviewCollection.find({created_by:email}).toArray()
      res.send(result);
    })

    // post method

    app.post('/reviews',async(req,res)=>{
      const data = req.body
      // console.log(data)
      const result =await reviewCollection.insertOne(data)
      res.send({
        success:true,
        result
      })
    })

    // put
    // update one

    app.put('/reviews/:id',async(req,res)=>{
      const {id} = req.params
      const data = req.body
      // console.log(id)
      // console.log(data)
      const objectId = new ObjectId(id)
      const filter = {_id:objectId}
      const update = {
        $set:data
      }
      const result = await reviewCollection.updateOne(filter,update)


      res.send({
        success:true,
        result
      })
    })

    // delete
    // delete one

    app.delete('/reviews/:id',async(req,res)=>{
      const {id} = req.params
      const objectId = new ObjectId(id)
      const filter = {_id:objectId}

      const result = await reviewCollection.deleteOne(filter)

       res.send({
        success:true,
        result
      })
    })
    


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
