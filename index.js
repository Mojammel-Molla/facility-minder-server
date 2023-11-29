const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());
// facility - minderDB;
// EMIMG0fIQ2J4Mfz5;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xljmjxf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const users = client.db('facility-minderDB').collection('users');
const apartments = client.db('facility-minderDB').collection('apartments');
const agreements = client.db('facility-minderDB').collection('agreements');
const announcements = client
  .db('facility-minderDB')
  .collection('announcements');
const coupons = client.db('facility-minderDB').collection('coupons');

// user data stored
app.post('/users', async (req, res) => {
  const user = req.body;
  const result = await users.insertOne(user);
  res.send(result);
});
//  get all users data
app.get('/users', async (req, res) => {
  const result = await users.find().toArray();
  res.send(result);
});

//  get all apartments data
app.get('/apartments', async (req, res) => {
  const result = await apartments.find().toArray();
  res.send(result);
});

// get specific apartment detail
app.get('/apartments/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const query = { _id: new ObjectId(id) };
  const result = await apartments.findOne(query);
  res.send(result);
});

// take agreement of apartment
app.post('/agreements', async (req, res) => {
  const agreement = req.body;
  const result = await agreements.insertOne(agreement);
  res.send(result);
});
//  get all apartments data
app.get('/agreements', async (req, res) => {
  const result = await agreements.find().toArray();
  res.send(result);
});
// delete apartment specific  by id
app.delete('/agreements/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const query = { _id: new ObjectId(id) };
  const result = await agreements.deleteOne(query);
  res.send(result);
});
// specific apartment status update by id
app.patch('/agreements/:id', async (req, res) => {
  const id = req.params.id;
  const accepted = req.body;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const coupon = {
    $set: {
      coupon: accepted.status,
    },
  };
  const result = await coupons.agreements(filter, coupon, options);
  res.send(result);
});

// Admin dashboard

// Announcements
app.post('/dashboard/make-announcements', async (req, res) => {
  const announcement = req.body;
  const result = await announcements.insertOne(announcement);
  res.send(result);
});

app.get('/dashboard/announcements', async (req, res) => {
  const result = await announcements.find().toArray();
  res.send(result);
});

// Manage coupons
app.patch('/dashboard/manage-coupons', async (req, res) => {
  const updatedCoupon = req.body;
  const filter = { coupon: 'FACILITY20' };
  const options = { upsert: true };
  const coupon = {
    $set: {
      coupon: updatedCoupon.coupon,
    },
  };
  const result = await coupons.updateOne(filter, coupon, options);
  res.send(result);
});
app.get('/dashboard/manage-coupons', async (req, res) => {
  const result = await coupons.find().toArray();
  res.send(result);
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('your facility minder server is running');
});

app.listen(port, () => {
  console.log(`your facility minder server is running on port ${port}`);
});
