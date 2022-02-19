const express = require('express');
const router = express.Router();
const homeControllers = require('../controllers/homeControllers');
const vacantesController = require('../controllers/vacantesController')
const usuariosController = require('../controllers/usuariosController')
const authController = require('../controllers/authController')
module.exports = ()=>{
    router.get('/',homeControllers.mostrarTrabajos);

  //crear vacantes 
  router.get('/vacantes/nueva',
  authController.verificarUsuario,
  vacantesController.formularioNuevaVacante);

  router.post('/vacantes/nueva', 
   authController.verificarUsuario,
   vacantesController.validarVacante,
  vacantesController.agregarVacante);


  //mostrar vacante(singular )
  router.get('/vacantes/:url',vacantesController.mostrarVacante);

  //aeditar vacante 
  router.get('/vacantes/editar/:url',
  authController.verificarUsuario,
  vacantesController.formEditarVacante);

  router.post('/vacantes/editar/:url',
  authController.verificarUsuario,
  vacantesController.validarVacante,
  vacantesController.editarVacante);

  //eliminar vacantes 
 router.delete('/vacantes/eliminar/:id',
       vacantesController.eliminarVacante
 )

  //crear cuenta 
  router.get('/crear-cuenta',usuariosController.formCrearCuenta);
  router.post('/crear-cuenta',
  usuariosController.validarRegistro,
  usuariosController.crearUsuario);
  

  //autenticarv usuarios 
  router.get('/iniciar-sesion',usuariosController.formIniciarSesion)
  router.post('/iniciar-sesion',authController.autenticarUsuario)
//cerra las sesiones 
router.get('/cerrar-sesion',
authController.verificarUsuario,
 authController.cerrarSesion
)

//reestablecer password 

router.get('/restablecer-password',authController.formRestablecerPassword)
router.post('/restablecer-password',authController.enviarToken)


//resetear password y guardar en la BD de
router.get('/restablecer-password/:token',authController.restablecerPassword)
router.post('/restablecer-password/:token',authController.guardarPassword)


  //panel de administracion 
  router.get('/administracion',
  authController.verificarUsuario,
  authController.mostrarPanel)

  //editara perfil 
 router.get('/editar-perfil',authController.verificarUsuario,
            usuariosController.formEditarPerfil
 )

 router.post('/editar-perfil',authController.verificarUsuario,
             // usuariosController.validarPerfil,
             usuariosController.subirImagen,
            usuariosController.editarPerfil
                        
 )

 //recinbir mensajes de candidatos v

 router.post('/vacantes/:url', vacantesController.subirCV,
                              vacantesController.contactar
 )
 
 //muestra los candidatos ´por vacante 

 router.get('/candidatos/:id',
            authController.verificarUsuario,
            vacantesController.mostrarCandidatos
 )

 //busacdor de vacantes 
 router.post('/buscador',vacantesController.buscarVacantes)

    return router;
}