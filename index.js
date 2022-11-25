const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


//middleware
app.use(cors())

app.get('/', (req, res) => {
    res.send('assignment 12 is running!');
});

app.listen(port, () => {
    console.log('Example app listening on port', port);
});


//const uri ="mongodb://localhost:27017"
const uri = `mongodb+srv://${process.env.DB}:${process.env.DP}@cluster0.8gaczek.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const categoriesCollection = client.db("resaleBookAssign12").collection("categoryCollection");
        const categoryBookCollection = client.db("resaleBookAssign12").collection("booksCollection");


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

    } finally { }
}
run().catch(err => console.error(err))




