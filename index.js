require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const Stripe = require('stripe')(process.env.STRIPE_KEY);
console.log(process.env.STRIPE_KEY);
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

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
const complaints = client.db('facility-minderDB').collection('complaints');
const apartments = client.db('facility-minderDB').collection('apartments');
const agreements = client.db('facility-minderDB').collection('agreements');
const announcements = client
  .db('facility-minderDB')
  .collection('announcements');
const coupons = client.db('facility-minderDB').collection('coupons');
const payments = client.db('facility-minderDB').collection('payments');
const reviews = client.db('facility-minderDB').collection('reviews');

// Post Jwt token
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1hr',
  });
  res.send({ success: true });
});
// post members complaint to the admin
app.post('/complaints', async (req, res) => {
  const newComplaint = req.body;
  const result = await complaints.insertOne(newComplaint);
  res.send(result);
});
// get complaint list
app.get('/complaints', async (req, res) => {
  const result = await complaints.find().toArray();
  res.send(result);
});

// Get client reviews
app.get('/reviews', async (req, res) => {
  const result = await reviews.find().toArray();
  res.send(result);
});

app.post('/reviews', async (req, res) => {
  const newReview = req.body;
  const result = await reviews.insertOne(newReview);
  res.send(result);
});

// user data stored
app.post('/users', async (req, res) => {
  const user = req.body;
  const query = { email: user.email };
  const existingUser = await users.findOne(query);
  if (existingUser) {
    return res.send({ massage: 'user already exists', insertedId: null });
  }
  const result = await users.insertOne(user);
  res.send(result);
});
//  get all users data
app.get('/users', async (req, res) => {
  let query = {};
  if (req.query.email) {
    query = { email: req.query.email };
  }
  const result = await users.findOne(query);
  res.send(result);
});

app.get('/all-users', async (req, res) => {
  const result = await users.find().toArray();
  res.send(result);
});
// get specific user agreements
app.get('/agreements', async (req, res) => {
  let query = {};
  if (req.query.email) {
    query = { email: req.query.email };
  }

  const result = await agreements.find(query).toArray();
  res.send(result);
});

//  get all apartments data
app.get('/apartments', async (req, res) => {
  const result = await apartments.find().toArray();
  res.send(result);
});

app.get('/all-apartments', async (req, res) => {
  const query = req.query;
  const page = query.page;
  const pageNumber = parseInt(page);
  const perPage = 8;
  const skip = pageNumber * perPage;

  try {
    const result = await apartments.find().skip(skip).limit(perPage).toArray();
    const count = await apartments.countDocuments();

    res.send({ result, count });
  } catch (error) {
    console.error('Error retrieving apartments:', error);
    res.status(500).send('Internal Server Error');
  }
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
app.put('/dashboard/manage-coupons/:id', async (req, res) => {
  const id = req.params.id;
  const updatedCoupon = req.body;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: false };
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

// Payment intent
app.post('/create-payment-intent', async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price) * 100;
  const paymentIntent = await Stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card'],
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});
// Payment data
app.post('/payments', async (req, res) => {
  const payment = req.body;
  const paymentResult = await payments.insertOne(payment);
  const query = {
    _id: {
      $in: payment.bookingIds.map(id => new ObjectId(id)),
    },
  };
  const deletedResult = await agreements.deleteMany(query);
  res.send({ paymentResult, deletedResult });
});

// get payment data
app.get('/payments', async (req, res) => {
  let query = {};
  if (req.query.email) {
    query = { email: req.query.email };
  }
  const result = await payments.find(query).toArray();
  res.send(result);
});
// app.get('/request-agreements', async (req, res) => {
//   const result = await payments.find().toArray;
//   res.send(result);
// });
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
