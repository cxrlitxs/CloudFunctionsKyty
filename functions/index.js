/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const functions = require("firebase-functions");

//Inicialización de la app con las creedenciales
initializeApp();

// Exporta la función 'addpost' como una Cloud Function para Firebase
exports.addpost = functions.region('europe-west1').https.onRequest(async (req, res) => {
    // Obtiene los parámetros 'nickName', 'body' y 'title' de la solicitud HTTP
    const nickName = req.query.nickName;
    const body = req.query.body;
    const title = req.query.title;
  
    try {
        // Inserta un nuevo documento en la colección 'pruebaPosts' en Firestore
        // Utiliza el SDK de Admin de Firebase para acceder a Firestore
        const writeResult = await getFirestore()
            .collection("pruebaPosts")
            .add({nickName: nickName, body: body, title: title});

        // Envía una respuesta JSON indicando que el post fue insertado correctamente
        res.json({result: `Post con ID: ${writeResult.id} fue insertado correctamente.`});
    } catch (error) {
        // Maneja cualquier error que ocurra durante la inserción de datos o la recuperación
        console.error("Error al insertar el mensaje: ", error);
        // Envía una respuesta de estado 500 (Error Interno del Servidor) si ocurre un error
        res.status(500).send('Error al insertar el post')
    }
});

// Exporta la función 'deletePost' como una Cloud Function para Firebase
exports.deletePost = functions.region('europe-west1').https.onRequest(async (req, res) => {
    // Obtener el ID del post a eliminar desde los parámetros de la solicitud HTTP
    const postId = req.query.postId;
  
    // Compruebar si se ha proporcionado el ID del post, devuelve un error 400 si no es así
    if (!postId) {
      return res.status(400).send('ID del post requerido');
    }
  
    try {
      // Localizar el post con el Id especificado en Firestore
      const docRef = getFirestore().collection("pruebaPosts").doc(postId);
  
      // Verificar si el documento (post) existe
      const doc = await docRef.get();
      if (!doc.exists) {
        // Si el documento no existe, devuelve un error 404
        return res.status(404).send(`No se encontró el elemento con ID: ${postId}`);
      }
  
      // Si el documento existe, eliminarlo
      await docRef.delete();
  
      // Enviar una respuesta JSON confirmando que el post ha sido eliminado
      res.json({ result: `El elemento con ID: ${postId} se eliminó correctamente.` });
    } catch (error) {
      // Manejar cualquier error durante la operación de eliminación
      console.error("Error al eliminar el post: ", error);
      // Enviar una respuesta de error 500 en caso de un error del servidor
      res.status(500).send('Error al eliminar el post');
    }
  });


// Exporta la función 'showPosts' como una Cloud Function de Firebase
exports.showPosts = functions.region('europe-west1').https.onRequest(async (req, res) => {
    try {
        // Establecer una referencia a la colección 'pruebaPosts' en Firestore
        const coleccionRef = getFirestore().collection("pruebaPosts");
  
        // Realizar una una consulta para obtener todos los documentos en la colección
        const snapshot = await coleccionRef.get();
  
        // Creación de un array para almacenar los datos de los documentos
        const posts = [];
        // Iterar a través de cada documento
        snapshot.forEach(doc => {
            // Agrega los datos del documento al array 'posts'
            // incluyendo el ID del documento y otros campos como 'nickName', 'title' y 'body'
            posts.push({ 
              id: doc.id, 
              nickName: doc.data().nickName, 
              title: doc.data().title, 
              body: doc.data().body 
            });
        });
  
        // Envía una respuesta con los datos de los posts en formato JSON
        res.json(posts);
    } catch (error) {
        // Maneja cualquier error que ocurra durante la obtención de los datos
        console.error("Error al obtener los posts: ", error);
        // Envía un estado de respuesta 500 (Error Interno del Servidor) en caso de error
        res.status(500).send('Error al obtener los posts');
    }
  });
  
// Exportar una función 'addtimestamp' como una Cloud Function de Firestore
exports.addtimestamp = functions.region('europe-west1').firestore
  // Especificar la ruta del documento en la colección 'pruebaPosts' que activará esta función
  // '{docId}' es un parámetro que representa el ID de cualquier documento que se cree en 'pruebaPosts'
  .document('pruebaPosts/{docId}')
  // Evento 'onCreate' que se activa cuando un nuevo documento es creado en la colección
  .onCreate(async (snap, context) => {
      // Obtener el ID del documento recién creado utilizando el parámetro 'docId' definido en la ruta del documento
      const docId = context.params.docId;

      // Crear un timestamp utilizando la hora actual del servidor
      const timestamp = FieldValue.serverTimestamp();

      // Actualizar el documento recién creado con el nuevo campo 'createdAt'
      // Esto añade el campo 'createdAt' al documento con el valor del timestamp del servidor
      return snap.ref.update({ createdAt: timestamp });
  });


// Exporta la función 'archivePost' como una Cloud Function que reacciona a eventos Firestore
exports.archivePost = functions.region('europe-west1').firestore
  // Especifica la ruta del documento en la colección 'pruebaPosts' que activará esta función
  // '{docId}' que captura el ID del documento que se elimina en 'pruebaPosts'
  .document('pruebaPosts/{docId}')
  // Evento 'onDelete' que se activa cuando un documento se elimina
  .onDelete(async (snap, context) => {
      // Crea un timestamp con la hora actual del servidor para marcar cuándo se eliminó el documento
      const deletedAt = FieldValue.serverTimestamp();

      // Prepara un objeto con los datos del documento eliminado para archivarlo
      const documentoParaArchivar = {
        nickName: snap.data().nickName, 
        title: snap.data().title, 
        body: snap.data().body,
        createdAt: snap.data().createdAt, // El campo 'createdAt' del documento original
        deletedAt: deletedAt, // El timestamp de eliminación
      };

    // Usar el mismo ID del documento eliminado para el documento en la colección 'archivePosts'
    const docId = context.params.docId;

    return getFirestore()
      .collection("archivePosts")
      .doc(docId) //Utilizar el mismo Id del que se ha borrado
      .set(documentoParaArchivar); // Usa set para guardar los datos en el documento (en este caso crearlo)
  });  
