import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { formatearFecha } from './app.js';

let escuchaComentarios = null; 

export function configurarModalInvitado(db, auth) {
    const vistaPublica = document.getElementById('vista-publica');
    const vistaLectura = document.getElementById('vista-lectura');

    document.getElementById('btn-volver-muro').addEventListener('click', () => {
        vistaLectura.style.display = 'none';
        vistaPublica.style.display = 'block';
        if (escuchaComentarios) escuchaComentarios(); 
    });

    document.getElementById('form-comentar').addEventListener('submit', async (e) => {
        e.preventDefault();
        const temaId = document.getElementById('tema-actual-id').value;
        const textoComentario = document.getElementById('input-nuevo-comentario').value;
        
        try {
            await addDoc(collection(db, "foro", temaId, "comentarios"), {
                texto: textoComentario,
                autor: auth.currentUser.displayName || auth.currentUser.email,
                fecha: new Date().getTime()
            });
            document.getElementById('form-comentar').reset();
        } catch (error) { console.error("Error al comentar:", error); }
    });
}

export function pintarTarjetaPublica(data, id, contenedor, db, isAdmin) {
    const divPublico = document.createElement('div');
    divPublico.className = 'comentario-card';
    divPublico.style.display = 'block'; 
    divPublico.style.cursor = 'pointer'; // Hace que parezca cliqueable
    
    const fechaBonita = formatearFecha(data.fecha);
    const titulo = data.titulo || 'Sin Tema';
    const autor = data.autor || 'Coordinador';

    // HTML basado en tu captura de diseño
    divPublico.innerHTML = `
        <div class="header-tarjeta">
            <span class="badge-estudio">   Tema </span>
            <span class="fecha-tarjeta">${fechaBonita}</span>
        </div>
        
        <h3 class="titulo-post" style="font-size: 22px; margin-bottom: 10px;">${titulo}</h3>
        <p class="texto-post">${data.texto.substring(0, 180)}...</p>
        
        <div class="footer-tarjeta">
            <div class="autor-icono">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                ${autor}
            </div>
            <div class="comentarios-icono">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                <span id="contador-tarjeta-${id}">0</span>
            </div>
        </div>
    `;
    contenedor.appendChild(divPublico);

    // Escuchar el número de comentarios en tiempo real para esta tarjeta
    const qContador = query(collection(db, "foro", id, "comentarios"));
    onSnapshot(qContador, (snap) => {
        const spanContador = document.getElementById(`contador-tarjeta-${id}`);
        if(spanContador) spanContador.textContent = snap.size;
    });

    // Al hacer clic en toda la tarjeta, se abre la lectura
    divPublico.addEventListener('click', () => {
        abrirVistaLectura(id, titulo, data.texto, fechaBonita, autor, db, isAdmin);
    });
}

function abrirVistaLectura(id, titulo, texto, fecha, autor, db, isAdmin) {
    document.getElementById('vista-publica').style.display = 'none';
    document.getElementById('vista-lectura').style.display = 'block';
    
    document.getElementById('lectura-titulo').textContent = titulo;
    document.getElementById('lectura-meta').textContent = `${fecha} • Por ${autor}`;
    document.getElementById('lectura-desarrollo').textContent = texto;
    document.getElementById('tema-actual-id').value = id;

    const qComentarios = query(collection(db, "foro", id, "comentarios"), orderBy("fecha", "asc"));
    if (escuchaComentarios) escuchaComentarios();

    const listaHilo = document.getElementById('lista-comentarios-hilo');
    const contadorSpan = document.getElementById('contador-comentarios');
    
    escuchaComentarios = onSnapshot(qComentarios, (snapshot) => {
        listaHilo.innerHTML = "";
        contadorSpan.textContent = snapshot.size;

        if(snapshot.empty) {
            listaHilo.innerHTML = "<p style='text-align:center; color:#777; font-size:14px; margin-top:20px;'>No hay comentarios aún. ¡Sé el primero!</p>";
        }
        
        snapshot.forEach((docSnap) => {
            const comentData = docSnap.data();
            const comentId = docSnap.id;
            const div = document.createElement('div');
            div.className = 'burbuja-comentario';
            
            // Si el usuario actual es Admin, inyectamos el botón de borrar
            let botonBorrarHTML = isAdmin 
                ? `<button class="btn-borrar-comentario" data-id="${comentId}">Borrar X</button>` 
                : '';

            div.innerHTML = `
                <div class="burbuja-header">
                    <span class="burbuja-autor">${comentData.autor}</span>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="burbuja-fecha">${formatearFecha(comentData.fecha)}</span>
                        ${botonBorrarHTML}
                    </div>
                </div>
                <div class="burbuja-texto">${comentData.texto}</div>
            `;
            listaHilo.appendChild(div);

            // Asignar evento al botón de borrar si existe
            if (isAdmin) {
                div.querySelector('.btn-borrar-comentario').addEventListener('click', async () => {
                    if(confirm("Administrador: ¿Borrar este comentario?")) {
                        await deleteDoc(doc(db, "foro", id, "comentarios", comentId));
                    }
                });
            }
        });
    });
}