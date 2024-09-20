
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


const port = 8001
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

    sql = "SELECT * from logged_in WHERE sessionid = (?)"
    db.get(sql,[req.sessionID],(err,row) => {
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



//get requests

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



app.get('/login',(req, res) => {
    
    if(req.session.authenticated){
        res.redirect('/admin/configuration')
    } else {
        res.render('pages/admin/login', {data : {req : req, res : res}})
    }
    
});


app.get('/admin/configuration', requireLogin ,(req,res) => {


    res.render('pages/admin/configuration', {data : {req : req, res : res}})
});




// post request

app.post('/login',(req, res) => {


    const {username, password} = req.body;
    
    if(username && password){
    
            if(password === process.env.ADMIN_PASSWORD && username === process.env.ADMIN_USERNAME) {

                sql = "INSERT INTO logged_in (sessionid) VALUES (?) "
                db.run(sql,[req.sessionID],(err, row) => {
                    if(err){
                        console.log("an error happend with the database while loggin in")
                    }
                })


                
                req.session.authenticated = true;
                req.session.user = {username, password}
                res.redirect('login')

                } else {
                    res.status(403).json({msg : "bad password"})
                }
        
        } else {
            res.status(400).json({msg : "missing password"})
        }
    
});



app.post('/admin/configuration', requireLogin ,(req,res)=>{


    sql = `INSERT INTO config (
        forside,
        tilmeldning,
        program,
        info) 
        VALUES (?,?,?,?)`

try {

    db.run(sql,[
        req.body.forside,
        req.body.tilmeldning,
        req.body.program,
        req.body.info], (err) => {
        if(err) {
            console.log("something went wrong");
            console.log(err);
            return res.json({
                message: err,
                status: 400,
                status: false,
            });
        } else {
            console.log("configuration has been changed");
            res.redirect('/admin/configuration')
        }
    }) 


} catch(error) {
    
    return res.json({
        message: "something went wrong when changing configurationPL",
        status: 400,
        success : false,
    })

}

})







/*

chatgpt to upload files


const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to store the files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  }
});

const upload = multer({ storage: storage });

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files (e.g., images)
app.use(express.static('uploads'));

// Render upload form
app.get('/upload', (req, res) => {
  res.render('upload');
});

// Handle file uploads (multiple files)
app.post('/upload', upload.array('photos', 5), (req, res) => {
  const filePaths = req.files.map(file => file.filename); // Store filenames of uploaded files
  res.render('gallery', { files: filePaths });
});






*/












app.listen(port, () => {
  console.log(`Tempeltur listening on port: ${port}`)
})