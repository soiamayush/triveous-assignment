const express = require("express")
const app = express();
const cookieParser = require("cookie-parser")

const bodyParser = require("body-parser") // added while implementing cloudinary
const fileUpload = require("express-fileupload")
const path = require("path")// for deployment
const dotenv = require("dotenv")

 
const errorMiddleware = require("./middlewares/error")
dotenv.config({ path : 'backend/config/config.env'}) // for development
// if (process.env.NODE_ENV !== 'PRODUCTION') require('dotenv').config({ path: 'backend/config/config.env' })
 // for production



app.use(express.json({limit: '50mb'}));

app.use(bodyParser.json({limit: '50mb'}));

app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));

app.use(cookieParser());

app.use(fileUpload())



//imports all routes
const products = require("./routes/product")
const auth = require("./routes/auth")
const order = require("./routes/order")
const payment = require("./routes/payment")


app.use("/api/v1", products);
app.use("/api/v1", auth);
app.use("/api/v1", payment);
app.use("/api/v1", order);

//middleware to handle error
app.use(errorMiddleware);

if (process.env.NODE_ENV === 'PRODUCTION') { // for deployment
    app.use(express.static(path.join(__dirname, '../frontend/build')))

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
    })
}

module.exports = app;