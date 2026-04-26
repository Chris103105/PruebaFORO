// Importamos funciones de Firebase y la función de fecha de app.js
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, deleteDoc, updateDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { formatearFecha } from './app.js';

// ==========================================
// LÓGICA DEL COORDINADOR
// ==========================================
export function configurarDashboard(db) {
    const auth = getAuth(); // Obtenemos quién está logueado

    // ------------------------------------------
    // 1. Cambiar entre Muro y Dashboard
    // ------------------------------------------
    const btnToggleDashboard = document.getElementById('btn-toggle-dashboard');
    const vistaPublica = document.getElementById('vista-publica');
    const vistaDashboard = document.getElementById('vista-dashboard');
    const vistaLectura = document.getElementById('vista-lectura');

    if (btnToggleDashboard) {
        btnToggleDashboard.addEventListener('click', () => {
            if (vistaDashboard.style.display === 'none') {
                vistaPublica.style.display = 'none';
                vistaLectura.style.display = 'none';
                vistaDashboard.style.display = 'block';
                btnToggleDashboard.textContent = 'Volver al Muro';
            } else {
                vistaPublica.style.display = 'block';
                vistaDashboard.style.display = 'none';
                vistaLectura.style.display = 'none';
                btnToggleDashboard.textContent = 'Abrir Dashboard';
            }
        });
    }

    // ------------------------------------------
    // 2. CREAR UN NUEVO TEMA (Tema y Desarrollo)
    // ------------------------------------------
    const modalCrear = document.getElementById('modal-crear');
    const formCrear = document.getElementById('form-crear');

    // Abrir la ventana de crear
    document.getElementById('btn-abrir-crear').addEventListener('click', () => {
        modalCrear.style.display = 'flex';
    });

    // Cancelar y cerrar
    document.getElementById('btn-cancelar-crear').addEventListener('click', () => {
        modalCrear.style.display = 'none';
        formCrear.reset();
    });

    // Subir a Firebase
    formCrear.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Capturamos los valores de los inputs
        const tema = document.getElementById('input-titulo').value;
        const desarrollo = document.getElementById('input-desarrollo').value;

        try {
            await addDoc(collection(db, "foro"), {
                titulo: tema,        // Guardamos el Tema
                texto: desarrollo,   // Guardamos el Desarrollo
                autor: auth.currentUser?.displayName || "Coordinador",
                fecha: new Date().getTime()
            });
            
            // Si tiene éxito, cerramos la ventana y limpiamos el formulario
            modalCrear.style.display = 'none';
            formCrear.reset();
        } catch (error) {
            console.error("Error al crear el nuevo tema:", error);
        }
    });

    // ------------------------------------------
    // 3. EDITAR UN TEMA EXISTENTE
    // ------------------------------------------
    const modalEditar = document.getElementById('modal-editar');
    const formEditar = document.getElementById('form-editar');
    
    document.getElementById('btn-cancelar-editar').addEventListener('click', () => {
        modalEditar.style.display = 'none';
    });

    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const nuevoTema = document.getElementById('edit-titulo').value;
        const nuevoDesarrollo = document.getElementById('edit-desarrollo').value;

        try {
            await updateDoc(doc(db, "foro", id), { 
                titulo: nuevoTema,
                texto: nuevoDesarrollo 
            });
            modalEditar.style.display = 'none'; 
        } catch (error) {
            console.error("Error al editar:", error);
        }
    });
}

// ==========================================
// 4. DIBUJAR TARJETAS EN EL DASHBOARD
// ==========================================
export function pintarTarjetaAdmin(data, id, contenedor, db) {
    const divAdmin = document.createElement('div');
    divAdmin.className = 'comentario-card';
    
    const tema = data.titulo || 'Sin Tema';
    const fechaBonita = formatearFecha(data.fecha);

    // Mostramos un resumen del texto (solo los primeros 100 caracteres)
    divAdmin.innerHTML = `
        <div class="contenido-post" style="flex: 1;">
            <div class="fecha-post">${fechaBonita}</div>
            <h3 class="titulo-post">${tema}</h3>
            <p class="texto-post">${data.texto.substring(0, 100)}...</p>
        </div>
        <div class="acciones">
            <button class="btn-editar">Editar</button>
            <button class="btn-borrar">Borrar</button>
        </div>
    `;
    
    contenedor.appendChild(divAdmin);

    // Asignar función al botón BORRAR
    divAdmin.querySelector('.btn-borrar').addEventListener('click', async () => {
        if(confirm("¿Estás seguro de borrar este tema definitivamente?")) {
            try { await deleteDoc(doc(db, "foro", id)); } 
            catch (error) { console.error("Error al borrar:", error); }
        }
    });

    // Asignar función al botón EDITAR (Abre la ventana y carga los datos)
    divAdmin.querySelector('.btn-editar').addEventListener('click', () => {
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-titulo').value = tema;
        document.getElementById('edit-desarrollo').value = data.texto;
        
        document.getElementById('modal-editar').style.display = 'flex';
    });
}