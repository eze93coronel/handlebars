  const mongoose = require('mongoose');
const express = require('express');
const  hbs = require('express-handlebars');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const path = require('path');
const router = require('./routes');
const cookieParser= require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const createError = require('http-errors'); 
const passport = require('./config/passport');
const conectarDB = require('./config/db');


require('dotenv').config({path:'variables.env'});

const app = express();

conectarDB();


// habliitar bodu¿y parser 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));



// conectamos ala basdse de datos 
//habilitar handelbars como view 
app.engine('handlebars',
    hbs.engine({
     // handlebars: allowInsecurePrototypeAccess(hbs),
    defaultLayout: 'main',
    helpers : require('./helpers/handlebars')

     })
);
app.set('view engine','handlebars');

app.use(express.static(path.join(__dirname,'/public')));

app.use(cookieParser());

app.use(session({
  secret: process.env.SECRETO,
  key:process.env.KEY,
 resave:false,
  saveUninitialized: false,

}))

app.use(flash());

 //crear un middleware 
 app.use((req, res, next)=>{
   res.locals.mensajes = req.flash();
   next();
 })


 //incializar passport para
app.use(passport.initialize());

app.use(passport.session());



 
app.use('/',router());

//404 error
app.use((req,res,next)=>{
    next(createError(404,'no encontrado'));
})

//administracion de error , en el middleware para maniúlara elmeerror siempre se asigna en la fn el error primero
app.use((error,req,res,next)=>{
  res.locals.mensaje = error.message;
const status = error.status || 500;
res.locals.status = status;
res.status(status);
  res.render('error');

})

app.listen(process.env.PUERTO);
