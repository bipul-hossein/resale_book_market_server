const express = require('express');
const app = express();
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIP_SECRET);


//middleware
app.use(express.json());
app.use(cors())

app.get('/', (req, res) => {
    res.send('assignment 12 is running!');
});

app.listen(port, () => {
    console.log('Example app listening on port', port);
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vfyc9gp.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

console.log(uri)

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {

        //mongodb
          const categoriesCollection = client.db("assignment12").collection("categoryCollection");
          const categoryBookCollection = client.db("assignment12").collection("bookItems");
          const bookingCollection = client.db("assignment12").collection("bookings");
          const usersCollection = client.db("assignment12").collection("user");
          const paymentCollection = client.db("assignment12").collection("payments"); 



         app.get('/categories', async (req, res) => {
 
             const query = {}
             const categories = await categoriesCollection.find(query).toArray();
             res.send(categories)
         }) 



        app.get('/categories/:id', async (req, res) => {
            const { id } = req.params;
            const query = { categoryName: id }
            const categoryBooks = await categoryBookCollection.find(query).toArray();
            res.send(categoryBooks)
        })

        app.get('/buyers', async (req, res) => {
            const query = { role: "buyer" }
            const allBuyer = await usersCollection.find(query).toArray()
            res.send(allBuyer)
        })

        //admin check
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        //seller check
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })

        app.get('/sellerbook/:email', async (req, res) => {
            const email = req.params.email;
            const query = { sellerEmail: email }
            const books = await categoryBookCollection.find(query).toArray()
            res.send(books)
        })

        app.get('/user/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/myorders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const books = await bookingCollection.findOne(query).toArray()
            res.send(books)
        })


        app.get('/sellers', verifyJWT, async (req, res) => {
            console.log(req.headers.authorization)
            const query = { role: "seller" }
            const allSeller = await usersCollection.find(query).toArray()
            res.send(allSeller)

        })


        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await bookingCollection.findOne(query);
            res.send(result)
        })

        //////////
        app.get('/advertisedbook', async (req, res) => {
            const query = { advertised: true}
            const result = await categoryBookCollection.find(query).toArray()
            res.send(result)
        })

        ///////
        app.post('/advertisedproduct', async (req, res) => {
            const advertisedId = req.body.id
            const query = { _id: ObjectId(advertisedId) }
            const updatedDoc = {
                $set: {
                    advertised: true,
                }
            }
            const result = await categoryBookCollection.updateOne(query, updatedDoc)
            res.send(result)


        })



        /////////



        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });


        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            const id = payment.bookingId
            const categoryId = payment.categoryBookId
            const queryForAddCategoryBook = { _id: ObjectId(categoryId) }
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const advertisedIdUpdate ={
                $set:{
                    advertised: false,
                }
            }

            const updatedResult = await categoryBookCollection.updateOne(queryForAddCategoryBook, advertisedIdUpdate)
            const updatedResultForBook = await bookingCollection.updateOne(query, updatedDoc)
            res.send(result);
        })


        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);

            const query = { _id: ObjectId(booking.categoryBookId) }
            const updatedDoc = {
                $set: {
                    paid: false,
                }
            }
            const updatedResult = await categoryBookCollection.updateOne(query, updatedDoc)
            res.send(result)
        });

        app.post('/addbook', async (req, res) => {
            const addBook = req.body;
            const result = await categoryBookCollection.insertOne(addBook)
            res.send(result)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })


        app.put('/users', async (req, res) => {
            const user = req.body;
            const email = user.email
            console.log(email)
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result)

        });



        app.delete('/book/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await categoryBookCollection.deleteOne(query);
            res.send(result)
        })

        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

    } finally { }
}
run().catch(err => console.error(err))




