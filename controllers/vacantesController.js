 const mongoose = require('mongoose');
 const Vacante = mongoose.model('Vacante')
 const { body, validationResult } = require("express-validator"); 
 const multer = require('multer');
 const shortid = require('shortid');

 exports.formularioNuevaVacante = (req,res)=>{
res.render('nueva-vacante',{ 
   nombrePagina: 'Nueva Vacante',
   tagline: 'llena el formulario y publica tu vacante',
   cerrarSesion: true,
   nombre : req.user.nombre,
   imagen : req.user.imagen,
   
})
 }

 //AGREGA LAS VACANTES ALA BASE DE DATOS DEL
 exports.agregarVacante =  async(req, res) =>{
    const vacante = new Vacante(req.body);
  
 // usuario autor de la vacante
 vacante.autor = req.user._id;

    //crear el arreglo de habilidades 
    vacante.skills = req.body.skills.split(',');

     //almacenarlo en la base de datos 
     const nuevaVacante = await vacante.save()

     //redirreccionar 
     res.redirect(`/vacantes/${nuevaVacante.url}`);

 }

 //muestra una vacante 
 exports.mostrarVacante = async (req,res,next)=>{
    const vacante = await Vacante.findOne({url:req.params.url}).populate('autor').lean();
  
   

    //si no ahi vacantes 
    if(!vacante) return next();

    res.render('vacante',{
       vacante,
       nombrePagina: vacante.titulo,
       barra: true
    })

    }

    exports.formEditarVacante = async (req,res,next) => {
       const vacante = await Vacante.findOne({ url: req.params.url}).lean();

       if(! vacante) return next();

       res.render('editar-vacante',{
          vacante,
          nombrePagina: `Editar - ${vacante.titulo}`,
          cerrarSesion: true,
          nombre : req.user.nombre,
          imagen : req.user.imagen
       })
    }
 exports.editarVacante = async(req, res)=>{
    const vacanteActualizada = req.body;


    vacanteActualizada.skills = req.body.skills.split(',');
    const vacante = await Vacante.findOneAndUpdate({ url: req.params.url}, vacanteActualizada,{
       new : true,
       runValidators : true
    })
    res.redirect(`/vacantes/${vacante.url}`);
 }
// validar y sanitizar las vacanates D

exports.validarVacante = async(req, res ,next) => {

   const rules = [
      body("titulo").not().isEmpty().withMessage("agrega un titulo").escape(),
      body("empresa").isEmail().withMessage("agrega una empresa ").escape(),
      body("ubicacion")
        .not()
        .isEmpty()
        .withMessage("agrega una ubicacion").escape(),
      body("contrato")
        .not()
        .isEmpty()
        .withMessage("selecciona le tipo de contrato").escape(),
        
      body("skills")
      .not()
      .isEmpty()
        .withMessage("Agrega almenos una habilidad")
        .escape(),
    ];
    await Promise.all(rules.map((validation) => validation.run(req)));
    const errors = validationResult(req);


if (errors) {
  // Recargar pagina con errores
  req.flash(
    "error",
    errors.array().map((error) => error.msg)
  );
  res.render("nueva-vacante", {
    nombrePagina: "Nueva Vacante",
    tagline: "LLena el Formulario y Publica tu Vacante",  
    cerrarSesion: true,
    nombre: req.user.nombre,
    mensajes: req.flash()
  });
  return;
}
next();


}

exports.eliminarVacante = async (req,res)=>{
   const {id} = req.params;
const vacante = await Vacante.findById(id);

 if(verifiacarAutor(vacante,req.user)){
    //tdo esta bien , si es el usuario, eliminalo
    vacante.remove();
    res.status(200).send('vacante eliminada correctamente');
 }else{
    res.status(403).send('error');
 }
   

}

const verifiacarAutor = (vacante = {},usuario = {})=> {
   if(!vacante.autor.equals(usuario._id)){
      return false
   }
   return true;
}

//subir archivos en pdf 

exports.subirCV = (req,res,next) => {
     
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
      
      res.redirect('back');
      
      return;
      
      }else{
      
      next();
      
      }
      
      });

}

const configuracionMulter = {
   limits : { fileSize  :300000},

   storage : fileStorage = multer.diskStorage({
       destination :(req, file, cb)=> {
           cb(null,__dirname+'../../public/uploads/cv/')
       },
       filename :(req,file,cb)=> {
           const extension = file.mimetype.split('/')[1];
           cb(null,`${shortid.generate()}.${extension}`);
       }
   }),
   fileFilter(req,file,cb){
     if(file.mimetype === 'application/pdf'){
         //el callback se ejecuta como true o false : true cuand la img se acepta la
         cb(null,true);
     }else{
         cb(new Error('formato no valido'));
     }
   }, 
   
}

const upload = multer(configuracionMulter).single('cv');


//contaCTAR 

exports.contactar = async(req, res, next) => {
        const vacante =  await Vacante.findOne({url:req.params.url}).lean();

        //si no existe la vacante
        if(! vacante) return next();

        //todo bien construir el nuevo objeto 

        const nuevoCandidato = {
         nombre: req.body.nombre,
         email: req.body.email,
         cv : req.file.filename

        }

        //almacenar la vacante del
      vacante.candidatos.push(nuevoCandidato);
      await vacante.save()
 //mensajes y redirect del
  
 req.flash('correcto','Se envio tu Curriculum Correctamente');
 res.redirect('/');




}

exports.mostrarCandidatos = async (req, res,next) => {
    const vacante = await Vacante.findById(req.params.id).lean();

    if(vacante.autor != req.user._id.toString()) {

      return next();
    }
    if(!vacante) return next();

    res.render('candidatos',{
       nombrePagina :  ` Candidatos Vacante - ${vacante.titulo}`,
       cerrarSesion: true,
       nombre: req.user.nombre,
       imagen : req.user.imagen,
       candidatos : vacante.candidatos

    })
}

//buscador de vcanates 

exports.buscarVacantes = async(req,res)=> {
   const vacante = await Vacante.find({
      $text:{
         $search : req.body.q
      }
   })

   //mostrar las vacanates en el home 
   res.render('home',{ 
      nombrePagina : `Resultados para la busqueda: ${req.body.q}`,
      barra: true,
      vacante
   })
}