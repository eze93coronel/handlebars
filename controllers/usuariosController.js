 const mongoose = require('mongoose');
const Usuarios = require('../models/Usuarios')
const {
    body,
    validationResult
} = require('express-validator');

const multer = require('multer');
const shortid = require('shortid');
//SUBIR IMAGEN 
exports.subirImagen = (req, res, next) => {

    upload(req, res, function(error){
    
    if(error){
    
    if(error instanceof multer.MulterError){//si el error fue generado por multer
    
    if(error.code === 'LIMIT_FILE_SIZE'){
    
    req.flash('error', 'El tamaño es demasiado grande. Máximo 100KB');
    
    }else{
    
    req.flash('error', error.message);
    
    }
    
    }else { // si el error no fue generado por multer
    
    // cuando el error es generado por express se puede leer el mensaje
    
    //usando la variable error.message
    
    req.flash('error', error.message);
    
    }
    
    res.redirect('/administracion');
    
    return;
    
    }else{
    
    next();
    
    }
    
    });
    
    }
    



//opciones de multer 
const configuracionMulter = {
    limits : { fileSize  :300000},

    storage : fileStorage = multer.diskStorage({
        destination :(req, file, cb)=> {
            cb(null,__dirname+'../../public/uploads/perfiles')
        },
        filename :(req,file,cb)=> {
            const extension = file.mimetype.split('/')[1];
            cb(null,`${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req,file,cb){
      if(file.mimetype === 'image/jpeg'|| file.mimetype === 'image/png'){
          //el callback se ejecuta como true o false : true cuand la img se acepta la
          cb(null,true);
      }else{
          cb(new Error('formato no valido'));
      }
    }, 
    
}

const upload = multer(configuracionMulter).single('imagen');


exports.formCrearCuenta = (req,res) => {
    res.render('crear-cuenta',{
        nombrePagina: 'Crea tu cuenta en devJobs',
        tagline: 'Comienza a publicar tus vacantes gartis, solo debes crear uan cuenta'
    })
}



exports.validarRegistro = async (req, res, next) => {
    //sanitizar los campos
    const rules = [
        body('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape(),
        body('email').isEmail().withMessage('El email es obligatorio').normalizeEmail(),
        body('password').not().isEmpty().withMessage('El password es obligatorio').escape(),
        body('confirmar').not().isEmpty().withMessage('Confirmar password es obligatorio').escape(),
        body('confirmar').equals(req.body.password).withMessage('Los passwords no son iguales')
    ];
 
    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);

    //si hay errores
    if (!errores.isEmpty()) {
  console.log(errores);

        req.flash('error', errores.array().map(error => error.msg));
        res.render('crear-cuenta', {
            nombrePagina: 'Crea una cuenta en Devjobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash()
        })
        return;
    }
    //si toda la validacion es correcta
    next();
}


exports.crearUsuario = async (req,res,next) => {
   // crear el usuaurio de
   const usuario = new Usuarios(req.body)
  try {
    await usuario.save();
    res.redirect('/iniciar-sesion');
      
  } catch (error) {
      req.flash('error', error);
      res.redirect('/crear-cuenta');
  }


 //if(!nuevoUsuario) return next();
 //res.redirect('/iniciar-sesion');
}
//formulario para iniciar sesion
exports.formIniciarSesion = (req,res) => {
   res.render('iniciar-sesion',{
       nombrePagina : 'Iniciar Sesion devJobs',
       
   })
}

// form editar perfil 
exports.formEditarPerfil = (req,res) => {
    res.render('editar-perfil',{
        nombrePagina : 'Edita tu perfil en devJobs',
        usuario: req.user.toObject(),
        cerrarSesion: true,
        nombre : req.user.nombre,
        imagen : req.user.imagen
    })
}

//guardar cambios editar perfil en
exports.editarPerfil = async(req,res) => {
    const usuario = await Usuarios.findById(req.user._id)

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;
    if(req.body.password){
        usuario.password = req.body.password;
    }
    if(req.file){
        usuario.imagen = req.file.filename;
    }


    await usuario.save();
  //alerta de cambios guardados 
  req.flash('correcto','cambios guardados correctamente');

    //redireccionif
    res.redirect('/administracion')
}

// SANITIZAR Y VALIDAR LOS PERFILES DE LOS CLIENTES 

exports.validarPerfil = async(req,res,next) => {
    const rules = [
      body('nombre').not().isEmpty().withMessage('el nombre no puede ir vacio').escape(),
      body('email').not().isEmpty().withMessage('el email no puede ir vacio').escape(),
   
      

    ];
    if(req.body.password){
        body('password').not().isEmpty().escape();
    };
    
    await Promise.all(rules.map((validation) => validation.run(req)));
    const errors = validationResult(req);

    if(errors){
          // Recargar pagina con errores
     req.flash(
    "error",
    errors.array().map((error) => error.msg)
    );

    res.render('editar-perfil',{
        nombrePagina : 'Edita tu perfil en devJobs',
        usuario: req.user.toObject(),
        cerrarSesion: true,
        nombre : req.user.nombre,
        imagen : req.user.imagen,
        mensajes : req.flash()
    });
    return;
    }
   next(); // sigue al siguiente middleware
  
}