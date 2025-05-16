/* Importing file system, path, express, middleware, and initializing port number */
const path = require("path");
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { request } = require("http");
const app = express();
const port = process.argv[2] || 3000;
const addCarRouter = require("./routes/addCar");
require('dotenv').config();

/* Defining the view/templating engine to use (from lecture slides) */
app.set("view engine", "ejs");
/* Directory where templates will reside (from lecture slides) */
app.set("views", path.resolve(__dirname, "templates"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* MongoDB Setup */
const databaseName = "CMSC335Projects";
const collectionName = "vinRecords";
let collection;

/* Server startup using IIFE as shown in lecture code */
(async () => {
    const uri = process.env.MONGO_CONNECTION_STRING;
    const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
        const database = client.db(databaseName);
        collection = database.collection(collectionName);

        app.use("/addCar", addCarRouter(collection));

        app.listen(port, () => {
            /* Show the connection success */
            console.log(`Web server started and running at http://localhost:${port}/`);
            /* Ask if the user wants to stop the server*/
            process.stdout.write("Stop to shutdown the server: ");
            process.stdin.on('data', (input)=> {
                if(input.toString().trim() === 'stop'){
                    console.log("Shutting down the server");
                    process.exit(0);
                } else {
                    console.log(`Invalid command: ${input.toString().trim()}`);
                    process.stdout.write("Stop to shutdown the server: ");
                }
            });
        });
    } catch (err){
        console.error("MongoDB failed", err);
        process.exit(1);
    }
})();

/* ===== ===== Defining and Processing Endpoints ===== ===== */

/* Renders the main page of the application and displays the contents of index.ejs */
app.get("/", (request, response) => {
    response.render('index');
});

/* Renders the search page of the application, asking the user for the model */
app.get("/search", (request, response) => {
    response.render('search');
});

/* Send the request to the API to find all models of the specified make. */
app.post("/search", async (request, response) => {
    const make = request.body.make;
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${make}?format=json`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        response.render('searchResults', {make, models: data.Results || []});
    } catch {
        response.render('searchResults', {make, models: []});
    }
});

/* This page will render all the database entries */
app.get("/view", async (request, response) => {
    try {
        const carsList = await collection.find().toArray();
        response.render('viewCars', {carsList});
    } catch(error){
        console.error("The cars couldn't be retrieved...", error);
    }
});

/* This will ask the user if they really want to delete everything from the database */
app.get("/delete", (request, response) => {
    response.render('delete');
});

/* This will actually delete all values */
app.post("/delete", async (request, response) => {
    try {
        const result = await collection.deleteMany({});
        response.render('deleteConfirm', {count: result.deletedCount});
    } catch (err) {
        console.error("Error deleting entries:", err);
    }
});