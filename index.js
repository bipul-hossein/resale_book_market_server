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

        app.get('/categories/:categoryName', async (req, res) => {
            const category = req.params.categoryName;
            const query = { categoryName: category }
            const categoryBooks =await categoryBookCollection.find(query).toArray();
            res.send(categoryBookCollection)
        })

    } finally { }
}
run().catch(err => console.error(err))




