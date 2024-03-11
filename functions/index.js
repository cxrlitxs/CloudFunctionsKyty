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

//Inicialización de la app con las creedenciales
initializeApp();

// Exporta la función 'addpost' como una Cloud Function para Firebase
exports.addpost = onRequest(async (req, res) => {
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
