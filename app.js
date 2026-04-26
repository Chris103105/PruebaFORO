import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } 
    from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy } 
    from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import { configurarDashboard, pintarTarjetaAdmin } from './coordinador.js';
import { configurarModalInvitado, pintarTarjetaPublica } from './invitado.js';

const firebaseConfig = {
    apiKey: "AIzaSyAuVximC609FvrFWr1EjbF3o-qPtsHUbg8",
    authDomain: "fenix-97eb9.firebaseapp.com",
    projectId: "fenix-97eb9",
    storageBucket: "fenix-97eb9.firebasestorage.app",
    messagingSenderId: "342747402569",
    appId: "1:342747402569:web:7a7628f6323653c3008a98"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const CORREO_COORDINADOR = "christopherjovel7@gmail.com"; 
let isAdminGlobal = false; // Variable para saber si el usuario actual es admin

configurarDashboard(db);
configurarModalInvitado(db, auth);

const seccionAuth = document.getElementById('seccion-auth');
const seccionForo = document.getElementById('seccion-foro');
const vistaPublica = document.getElementById('vista-publica');
const vistaDashboard = document.getElementById('vista-dashboard');
const vistaLectura = document.getElementById('vista-lectura');
const userEmailSpan = document.getElementById('user-email');
const btnToggleDashboard = document.getElementById('btn-toggle-dashboard');

onAuthStateChanged(auth, (user) => {
    if (user) {
        seccionAuth.style.display = 'none';
        seccionForo.style.display = 'block';
        userEmailSpan.textContent = user.displayName || user.email;

        const correoUsuario = user.email.toLowerCase();
        const correoAdmin = CORREO_COORDINADOR.toLowerCase();
        isAdminGlobal = (correoUsuario === correoAdmin); // Guardamos el estado

        if (isAdminGlobal) {
            btnToggleDashboard.style.display = 'block'; 
            vistaPublica.style.display = 'block'; 
            vistaDashboard.style.display = 'none';
            vistaLectura.style.display = 'none'; 
        } else {
            btnToggleDashboard.style.display = 'none';
            vistaPublica.style.display = 'block'; 
            vistaDashboard.style.display = 'none';
            vistaLectura.style.display = 'none'; 
        }

        // Le pasamos si es admin o no a la función
        cargarTemas(isAdminGlobal);
    } else {
        seccionAuth.style.display = 'block';
        seccionForo.style.display = 'none';
    }
});

document.getElementById('btn-google').addEventListener('click', async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { console.error("Error Auth:", error); }
});
document.getElementById('btn-cerrar-sesion').addEventListener('click', () => signOut(auth));

export function formatearFecha(timestamp) {
    if (!timestamp) return 'Fecha desconocida';
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(timestamp).toLocaleDateString('es-SV', opciones);
}

function cargarTemas(isAdmin) {
    const q = query(collection(db, "foro"), orderBy("fecha", "desc"));
    
    onSnapshot(q, (snapshot) => {
        const listaPublica = document.getElementById('lista-comentarios');
        const listaAdmin = document.getElementById('lista-admin');
        const statTotal = document.getElementById('stat-total');
        
        listaPublica.innerHTML = "";
        listaAdmin.innerHTML = "";
        statTotal.textContent = snapshot.size; 
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Pintamos las tarjetas pasándoles el estado isAdmin
            pintarTarjetaPublica(data, id, listaPublica, db, isAdmin);
            pintarTarjetaAdmin(data, id, listaAdmin, db);
        });
    });
}