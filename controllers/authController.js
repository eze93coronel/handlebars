const passport = require('passport');
const mongoose = require('mongoose');
const Vacante = require('../models/Vacantes')
const Usuarios = require('../models/Usuarios');
const crypto = require('crypto');
const enviarEmail = require('../handlebar/email');
exports.autenticarUsuario = passport.authenticate('local',{
    successRedirect : '/administracion',
    failureRedirect :'/iniciar-sesion',
    failureFlash : true,
    badRequestMessage : 'Bad request'
});
 //revisar si el uususario esta autenticado o no es
 exports.verificarUsuario = (req, res,next) => {
    //revisar el user
    if(req.isAuthenticated()){
        return next(); //estan autenticados
    }

    //redireccionar el user
    res.redirect('/iniciar-sesion');
 }

exports.mostrarPanel = async (req,res) => {


 //consultar el usuario autenticado
   const vacantes = await Vacante.find({autor : req.user._id}).lean();
    res.render('administracion',{
        nombrePagina : 'Panel de administracion',
        tagline : 'Crea y Administra tus Vacantes desde aqui',
        cerrarSesion: true,
        nombre : req.user.nombre,
        imagen : req.user.imagen,
        vacantes
    })
}

// cerrar sesion  
exports.cerrarSesion = (req, res) => {
   req.logout();
  req.flash('correcto','Cerraste la sesion Correctamente');
     return res.redirect('/iniciar-sesion')
}

exports.formRestablecerPassword = (req, res) => {
 
    res.render('restablecer-password', {
        nombrePagina : 'Reestablece tu password',
        tagline : 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu email'
    })

}
//genera un token en la tabla de usuario
exports.enviarToken = async(req, res)=>{
   const usuario = await Usuarios.findOne({email: req.body.email});

   if(!usuario){
       req.flash('error','No existe esa cuenta ');
     return  res.redirect('/iniciar-sesion');
   }

   //el usuario existe generar token
   usuario.token = crypto.randomBytes(20).toString('hex');
   usuario.expira = Date.now()+ 3600000;

   await usuario.save();
   const resetUrl = `http://${req.headers.host}/restablecer-password/${usuario.token}`

   //console.log(resetUrl);
   //TODO: enviar not por email para
  await enviarEmail.enviar({
      usuario,
      subject : 'Password Reset',
      resetUrl,
      archivo : 'reset'
  })

   req.flash('correcto','Revisa tu usuario para las indicaciones');
   res.redirect('/iniciar-sesion');
};
//valida is el user es valido y el token existe muestra en la vista
exports.restablecerPassword = async(req, res)=>{
   const usuario = await Usuarios.findOne({ 
       token: req.params.token, 
       expira: { 
           $gt: Date.now()
       }
   });
   if(!usuario){
       req.flash('error','el formulario ya no es valido intenta de nuevo');
       return res.redirect('/restablecer-password');
   }

   //si esta todo bien t
   res.render('nuevo-password',{
       nombrePagina : 'Nuevo Password'
   })
};

//lamacena nuevo pass en la base de datos 
exports.guardarPassword = async(req, res)=>{
    const usuario = await Usuarios.findOne({ 
        token: req.params.token, 
        expira: { 
            $gt: Date.now()
        }
    });
    // no exsite el usuario o token es invalido
    if(!usuario){
        req.flash('error','el formulario ya no es valido intenta de nuevo');
        return res.redirect('/restablecer-password');
    }
   //limpiar y asignar nuevo pass 
   usuario.password = req.body.password;
   usuario.token = undefined;
   usuario.expira = undefined;

   //agregar y eliminar valores 
       await usuario.save();

       //redirigir 
       req.flash('correcto','se guardo el password correctamente');
       res.redirect('/iniciar-sesion');
}