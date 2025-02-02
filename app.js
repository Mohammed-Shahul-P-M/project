const express = require('express')
const port = process.env.PORT || 3000
const db = require('./config/connection')
const exhbs = require('express-handlebars')
const session = require('express-session')
const fileUpload = require('express-fileupload')
const sharp = require('sharp')
const app = express()

// setting view engin
const hbs = exhbs.create({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layout/',
    partialsDir: __dirname + '/views/partials/',
    helpers: {
        inc: function (value, option) {
            return parseInt(value) + 1
        },
        ifEq: function (key, value, options) {
            if (key == value) return options.fn(this)
            else return options.inverse(this)
        },
        iflt: function (key, value, option) {
            if (key < value) return option.fn(this)
            else return option.inverse(this)
        },
        X: function (val, val2) {
            return (val * val2)
        },
        json: function (obj) {
            return JSON.stringify(obj)
        },
        ifGt: function (key, value, options) {
            return (key > value) ? options.fn(this) : options.inverse(this)
        },
        round: function (value) {
            return value.toFixed(2)
        }
    }
})
app.set('views', __dirname + '/views')
app.set('view engine', 'hbs')
app.engine('hbs', hbs.engine)

// setting up the middlewares
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static(__dirname + '/public'));
app.use(session({ secret: 'keyst', cookie: { maxAge: 60000 * 60 }, resave: false, saveUninitialized: false }))
app.use(fileUpload())
//establishing mongodb database connection 
db.connect((err) => {
    if (err) console.log(err);
    else console.log('connected to database');
})
// importing routes and using it
app.use('/', require('./routes/user'))            // route for user
app.use('/dealer', require('./routes/dealer'))   // route for dealer
app.use('/admin', require('./routes/admin'))    // route for admin


app.listen(port, () => console.log('server up on ' + port))