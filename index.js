const express = require('express');
const app = express();
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


//middleware
app.use(express.json());
app.use(cors())

app.get('/', (req, res) => {
    res.send('assignment 12 is running!');
});

app.listen(port, () => {
    console.log('Example app listening on port', port);
});


const uri = "mongodb://localhost:27017"
//const uri = `mongodb+srv://${process.env.DB}:${process.env.DP}@cluster0.8gaczek.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

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
        const categoriesCollection = client.db("resaleBookAssign12").collection("categoryCollection");
        const categoryBookCollection = client.db("resaleBookAssign12").collection("booksCollection");
        const bookingCollection = client.db("resaleBookAssign12").collection("bookings");
        const usersCollection = client.db("resaleBookAssign12").collection("users");


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

        app.get('/sellers',verifyJWT, async (req, res) => {
            console.log(req.headers.authorization)
           
            const query = { role: "seller" }
            const allSeller = await usersCollection.find(query).toArray()
            res.send(allSeller)

        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            console.log(email)
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            console.log(user)
            res.status(403).send({ accessToken: '' })
        })


        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

    } finally { }
}
run().catch(err => console.error(err))




