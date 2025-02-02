/* imported the dependencies */
// Assign the imported `express` module to the constant variable `express`
const express = require("express");
// Assign the newly created express application to the constant variable `app`
const app = express();
// Assign the MongoClient class that's attached to the `connect` method exported by the `mongodb` module to the constant variable `MongoClient`
const MongoClient = require("mongodb").MongoClient;
// Assign a PORT environment variable to the constant variable `PORT`
const PORT = 2121;
// Call the `config` method on the imported `dotenv` module, loading the environment variables from the `.env` file into `process.env` and look in file
require("dotenv").config();

// Declare three mutable variables, `db` to store the Db class instance, `connectionString` to store the connection string read from the `DB_STRING` environment variable, and `dbName` to store the name of the database we want to use.
let db,
  dbConnectionStr = process.env.DB_STRING,
  dbName = "todo";

// Call the static `connect` method on the `MongoClient` class, passing the `dbConnectionStr` and an options object with the `useUnifiedTopology` property set to `true` to use the new Server Discover and Monitoring engine.
MongoClient.connect(dbConnectionStr, { useUnifiedTopology: true })
  // As no callback is provided, the `connect` method returns a Promise that will resolve to a `MongoClient` instance, so use the .then method to execute our callback with the said `MongoClient`.
  .then((client) => {
    // console log the client connection String to notify that the connection has been established
    console.log(`Connected to ${dbName} Database`);
    // Assign the desired `Db` instance - returned by the `db` method on the `MongoClient` instance - to the `db` variable.
    db = client.db(dbName);
  });

/*middleware*/
// Call the `set` method of our express application, settings the default engine extension, allowing us to omit said extension when specifying view names.
app.set("view engine", "ejs");
// Add the `serve-static` middleware to our express application, serving any files requested from the root found in the `public` directory.
app.use(express.static("public"));
// Add the `body-parser` `urlencoded` middleware to our express application, parsing the content of any requests with a `Content-Type` of `application/x-www-form-urlencoded` to a JavaScript object assigned to the request `body` property - additionally setting the `extended` property to `true` within the options object to allow for nested objects via the `qs` module.
app.use(express.urlencoded({ extended: true }));
// Add the `body-parser` `json` middleware to our express application, parsing the content of any requests with a `Content-Type` of `application/json` to a JavaScript object assigned to the request `body` property.
app.use(express.json());

// Add a custom request handler to the `GET` method of the `/` path
app.get("/", async (req, res) => {
  // Access the `todos` collection from the connected database, calling `find` with no filter object to retrieve all the documents, and finally call `toArray` to turn this query into a Promise that will resolve with an array of document objects.
  const todoItems = await db.collection("todos").find().toArray();
  // Access the `todos` collection from the connected database, calling `countDocuments` with a filter to only include documents that have a `completed` property set to `false`.
  const itemsLeft = await db
    .collection("todos")
    .countDocuments({ completed: false });
  //rendering ejs file and passing through thr database items and the count remaining inside the object
  res.render("index.ejs", { items: todoItems, left: itemsLeft });
  // db.collection('todos').find().toArray()
  // .then(data => {
  //     db.collection('todos').countDocuments({completed: false})
  //     .then(itemsLeft => {
  //         res.render('index.ejs', { items: data, left: itemsLeft })
  //     })
  // })
  // .catch(error => console.error(error))
});

//start a POST method in path `addTodo`
app.post("/addTodo", (req, res) => {
  // Access the `todos` collection from the connected database, calling `insertOne` with an object containing the properties `thing` and `completed` set to the values of the `request.body.todoItem` - parsed by the `urlencoded` middleware - and `false` respectively.
  db.collection("todos")
    .insertOne({ thing: req.body.todoItem, completed: false })
    // After the insertion is successful, redirect the user to the `/` path.
    .then((result) => {
      console.log("Todo Added");
      res.redirect("/");
    })
    // If the insertion fails, log the error to the console.
    .catch((error) => console.error(error));
});

//start a PUT method with in a path `/markComplete`
app.put("/markComplete", (req, res) => {
  // Access the `todos` collection from the connected database, and look for one item matching the name `thing` that passed in form the main.js file that clicked on
  db.collection("todos")
    .updateOne(
      { thing: req.body.itemFromJS },
      {
        // UpdateFilter containing the `$set` Update Operator, telling MongoDB to setting the `completed` property to `true`.
        $set: {
          completed: true,
        },
      },
      {
        // Attempt to sort the document _id's descending to get the latest document first - this works because the `_id` is a `ObjectId` and these contain the second they were created encoded within them.
        sort: { _id: -1 },
        // Disable the upsert - if the document does not exist, do not create it - this is
        upsert: false,
      }
    )
    // After the update is successful, redirect the user to the `/` path.
    .then((result) => {
      console.log("Marked Complete");
      res.json("Marked Complete");
    })
    // If the update fails, log the error to the console.
    .catch((error) => console.error(error));
});

//start a PUT method with in a path `markUnComplete`
app.put("/markUnComplete", (req, res) => {
  //do the same thing as do in markComplete in put method
  db.collection("todos")
    .updateOne(
      { thing: req.body.itemFromJS },
      {
        // UpdateFilter containing the `$set` Update Operator, telling MongoDB to setting the `completed` property to `false`.
        $set: {
          completed: false,
        },
      },
      {
        //same stuff as above
        sort: { _id: -1 },
        upsert: false,
      }
    )
    .then((result) => {
      console.log("Marked Complete");
      res.json("Marked Complete");
    })
    .catch((error) => console.error(error));
});

//start a Delete method with in a path `/deleteItem"`
app.delete("/deleteItem", (req, res) => {
  //look inside the todos collection for the one that has a matching name from js file
  db.collection("todos")
    .deleteOne({ thing: req.body.itemFromJS })
    .then((result) => {
      console.log("Todo Deleted");
      res.json("Todo Deleted");
    })
    // If the delete fails, log the error to the console.
    .catch((error) => console.error(error));
});

// Start the server listening on either the PORT provided via environment variable or the default port stored in the PORT variable.
app.listen(process.env.PORT || PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
