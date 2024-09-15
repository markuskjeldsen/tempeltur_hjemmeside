
const express = require('express');
const cors = require('cors');
const path = require('path')
const session = require('express-session')
const bodyParser = require('body-parser');
const sqlite = require('sqlite3').verbose();
const url = require('url');
const store = new session.MemoryStore();
require('dotenv').config();

//https://github.com/expressjs/express/blob/master/examples/auth/views/login.ejs


const port = 3000
const app = express();
let sql
const sqlpass = "'&GOG^7tx/gZ6{)D"
const week = ["Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"]
const db = new sqlite.Database('./database.db',sqlite.OPEN_READWRITE,(err) => {
    if (err) return console.error(err);
})


app.set('view engine', 'ejs')
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'views')));
app.use(session({
    secret: 'some secret', //used to sign session id
    cookie: {maxAge: 60000 * 60 * 2}, //expire after 60 sec 60.000 ms * 60 = 1 hour
    saveUninitialized: true, //if true will generate new ID every sessino
    resave: true,
    store
}))


const login = (req,res,next) => {

    sql = "SELECT * from logged_in WHERE sessionid = ' " + req.sessionID + " ' "
    db.get(sql,(err,row) => {
        if (row) {
            req.session.authenticated = true
            next();

        } else {
            req.session.authenticated = false
            next();
        }        
    })

}

const requireLogin = (req,res,next) => {
    if (req.session.authenticated == true){
        next();
    } else {
        res.redirect('/login')
    }
}

// Define your middleware to handle multiple queries
app.use(async (req, res, next) => {
    try {
        // query config
        const queryResult1 = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM config ORDER BY id DESC', (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });


/*
        //query participants
        const queryResult2 = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM participants', (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        const queryResult3 = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM configurationPL ORDER BY id DESC', (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });


        const queryResult4 = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM faqs ORDER BY id DESC', (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        const queryResult5 = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM sange ORDER BY id ASC', (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
*/



        // Pass the query results to the EJS template
        res.locals.config = queryResult1[0];


/*
        res.locals.participants = queryResult2;
        res.locals.configurationPL = queryResult3[0];
        res.locals.faqs = queryResult4;
        res.locals.sange = queryResult5;
*/     
    
        next();

    } catch (error) {
        console.error('Error executing SQL queries:', error);
        res.status(500).send('Internal Server Error');
    }
});




app.use(login)
app.use((req,res,next) => {
    console.log(Date() + "ID:" + req.sessionID)
    next(); 
});






app.get('/',(req, res) => {
    res.render('pages/index', {data : {req : req, res : res}})
});

app.get('/program',(req, res) => {
    res.render('pages/program', {data : {req : req, res : res}})
});

app.get('/tilmeldning',(req, res) => {
    res.render('pages/tilmeldning', {data : {req : req, res : res}})
});

app.get('/praktisk-info',(req, res) => {
    res.render('pages/praktisk-info', {data : {req : req, res : res}})
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})