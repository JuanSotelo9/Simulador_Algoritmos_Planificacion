// Clase para representar un proceso
class Proceso {
    constructor(id, llegada, ejecucionTotal, bloques) {
        this.id = id;
        this.llegada = llegada;
        this.ejecucionTotal = ejecucionTotal;
        this.ejecucionRestante = ejecucionTotal;
        this.bloques = bloques;
        this.bloqueActual = 0;
        this.bloqueoHasta = 0;
        this.tiempoBloqueo = 0;
        this.tiempoRespuesta = 0;
        this.instanteFin = 0;
        this.vecesEjecutado = 0;
        this.estado = 'listo';
    }
}


// Variables globales
let procesos = [];
let siguienteId = 1;

// Algoritmos de planificación
const Algoritmos = {
    FCFS: {
        nombre: "First Come First Served con Bloqueos",
        descripcion: "Ejecuta los procesos en orden de llegada, permitiendo bloqueos.",
        ejecutar: function (procesos) {
            let tiempo = 0;
            let terminados = [];
            let listos = [];
            let bloqueados = [];
            let estadisticas = [];
            let tiempoCPU = 0;
            let tiempoPlanificacion = 0;

            // Copiar procesos y ordenarlos por llegada
            let colaLlegada = procesos.map(p => new Proceso(p.id, p.llegada, p.ejecucionTotal, [...p.bloques]))
                .sort((a, b) => a.llegada - b.llegada);

            while (colaLlegada.length > 0 || listos.length > 0 || bloqueados.length > 0) {
                // 1. Llegada de nuevos procesos
                while (colaLlegada.length > 0 && colaLlegada[0].llegada <= tiempo) {
                    listos.push(colaLlegada.shift());
                }

                // 2. Desbloqueo de procesos
                for (let i = 0; i < bloqueados.length; i++) {
                    const proceso = bloqueados[i];
                    if (tiempo >= proceso.bloqueoHasta) {
                        bloqueados.splice(i, 1);
                        listos.push(proceso);
                        i--;
                    }
                }

                // 3. Si no hay procesos listos, avanzar el tiempo
                if (listos.length === 0) {
                    tiempo++;
                    tiempoPlanificacion++;
                    continue;
                }

                // 4. Ejecutar proceso actual (FCFS)
                const proceso = listos.shift();

                // Tiempo de respuesta si es la primera vez
                if (proceso.vecesEjecutado === 0) {
                    proceso.tiempoRespuesta = tiempo - proceso.llegada;
                }

                while (proceso.ejecucionRestante > 0) {
                    const bloque = proceso.bloques[proceso.bloqueActual];
                    const ejecutadoHastaAhora = proceso.ejecucionTotal - proceso.ejecucionRestante;

                    // Bloqueo si corresponde
                    if (bloque && ejecutadoHastaAhora === bloque.inicio) {
                        proceso.estado = 'bloqueado';
                        proceso.bloqueoHasta = tiempo + bloque.duracion;
                        proceso.tiempoBloqueo += bloque.duracion;
                        proceso.bloqueActual++;
                        bloqueados.push(proceso);
                        tiempo += bloque.duracion;
                        tiempoPlanificacion += bloque.duracion;
                        break; // sale del while y vuelve al ciclo principal
                    }

                    // Ejecuta una unidad de tiempo
                    proceso.ejecucionRestante--;
                    proceso.vecesEjecutado++;
                    tiempo++;
                    tiempoCPU++;
                }

                // Si terminó, registramos
                if (proceso.ejecucionRestante === 0) {
                    proceso.instanteFin = tiempo;
                    terminados.push(proceso);
                }
            }

            // Calcular estadísticas
            terminados.forEach(p => {
                const retorno = p.instanteFin - p.llegada;
                const tiempoPerdido = retorno - p.ejecucionTotal - p.tiempoBloqueo;
                const penalidad = (retorno / p.ejecucionTotal).toFixed(2);

                estadisticas.push({
                    proceso: p.id,
                    ejecucion: p.ejecucionTotal,
                    espera: tiempoPerdido,
                    bloqueo: p.tiempoBloqueo,
                    instanteFin: p.instanteFin,
                    retorno: retorno,
                    tiempoPerdido: tiempoPerdido,
                    penalidad: penalidad,
                    tiempoRespuesta: p.tiempoRespuesta
                });
            });

            // Métricas globales
            const tiempoTotal = tiempo;
            const usoCPU = ((tiempoCPU / tiempoTotal) * 100).toFixed(2);
            const usoPlanificacion = ((tiempoPlanificacion / tiempoTotal) * 100).toFixed(2);

            return {
                estadisticas: estadisticas,
                tiempoTotal: tiempoTotal,
                tiempoCPU: tiempoCPU,
                tiempoPlanificacion: tiempoPlanificacion,
                usoCPU: usoCPU,
                usoPlanificacion: usoPlanificacion
            };
        }
    },

    SJF: {
        nombre: "Shortest Job First",
        descripcion: "Ejecuta primero el proceso con menor tiempo de ejecución (no expropiativo).",
        ejecutar: function(procesos){
            let tiempo = 0;
            let listos = [];
            let bloqueados = [];
            let terminados = [];
            let procesoActual = null;
            let estadisticas = [];
            let tiempoCPU = 0;
            let tiempoPlanificacion = 0;

            // Se copia los procesos y se ordenan por orden de llegada
            let colaLlegada = procesos.map(p => new Proceso(p.id, p.llegada, p.ejecucionTotal, [...p.bloques]))
                                .sort((a,b) => a.llegada - b.llegada);

            while (colaLlegada.length > 0 || listos.length > 0 || bloqueados.length > 0){

                // Revisamos si llegan nuevos procesos
                while (colaLlegada.length > 0 && colaLlegada[0].llegada <= tiempo) {
                    listos.push(colaLlegada.shift());
                }

                // Revisamos si se termina algun bloqueo
                for (let i = 0; i < bloqueados.length; i++) {
                    const proceso = bloqueados[i];
                    if (tiempo >= proceso.bloqueoHasta) {
                        bloqueados.splice(i, 1);
                        listos.push(proceso);
                        i--;
                    }
                }

                // Si no hay procesos listos, el tiempo avanzara
                if (listos.length === 0) {
                    tiempo++;
                    tiempoPlanificacion++;
                    continue;
                }

                // Seleccionamos el proceso con menor tiempo de ejecucion
                listos.sort((a, b) => a.ejecucionTotal - b.ejecucionTotal);
                procesoActual = listos.shift();

                // Se calcula el tiempo de respuesta si es la primera vez que llega
                if (procesoActual.vecesEjecutado === 0){
                    procesoActual.tiempoRespuesta = tiempo - procesoActual.llegada;
                }

                while (procesoActual.ejecucionRestante > 0){
                    const bloque = procesoActual.bloques[procesoActual.bloqueActual];
                    const ejecucionHastaAhora = procesoActual.ejecucionTotal - procesoActual.ejecucionRestante;
                    
                    // Verificamos si inicia un bloqueo
                    if (bloque && ejecucionHastaAhora === bloque.inicio){
                        procesoActual.estado = 'bloqueado';
                        procesoActual.bloqueoHasta = tiempo + bloque.duracion;
                        procesoActual.tiempoBloqueo += bloque.duracion;
                        procesoActual.bloqueActual++;
                        bloqueados.push(procesoActual);
                        break; // sale del while y vuelve al ciclo principal
                    }

                    // Ejecutamos una unidad de tiempo
                    procesoActual.ejecucionRestante--;
                    procesoActual.vecesEjecutado++;
                    tiempo++;
                    tiempoCPU++;
                }

                if (procesoActual.ejecucionRestante === 0){
                    procesoActual.instanteFin = tiempo;
                    terminados.push(procesoActual);
                }

            }
            // Calcular estadisticas
            terminados.forEach(p => {
                const retorno = p.instanteFin - p.llegada;
                const tiempoPerdido = retorno - p.ejecucionTotal - p.tiempoBloqueo;
                const penalidad = (retorno / p.ejecucionTotal).toFixed(2);

                estadisticas.push({
                    proceso: p.id,
                    ejecucion: p.ejecucionTotal,
                    espera: tiempoPerdido,
                    bloqueo: p.tiempoBloqueo,
                    instanteFin: p.instanteFin,
                    retorno: retorno,
                    tiempoPerdido: tiempoPerdido,
                    penalidad: penalidad,
                    tiempoRespuesta: p.tiempoRespuesta
                });
            });

            estadisticas.sort((a, b) => a.proceso.localeCompare(b.proceso));

            const tiempoTotal = tiempo;
            const usoCPU = ((tiempoCPU / tiempoTotal) * 100).toFixed(2);
            const usoPlanificacion = ((tiempoPlanificacion / tiempoTotal) * 100).toFixed(2);

            return {
                estadisticas: estadisticas,
                tiempoTotal: tiempoTotal,
                tiempoCPU: tiempoCPU,
                tiempoPlanificacion: tiempoPlanificacion,
                usoCPU: usoCPU,
                usoPlanificacion: usoPlanificacion
            };

        }
        
        
    },

    SRTF: {
        nombre: "Shortest Remaining Time First",
        descripcion: "Ejecuta el proceso con menor tiempo restante (expropiativo).",
        ejecutar: function (procesos) {
            let tiempo = 0;
            let listos = [];
            let bloqueados = [];
            let terminados = [];
            let procesoActual = null;
            let estadisticas = [];
            let tiempoCPU = 0;
            let tiempoPlanificacion = 0;

            let procesosRestantes = procesos.map(p => new Proceso(p.id, p.llegada, p.ejecucionTotal, [...p.bloques]));

            function actualizarColas() {
                // Agregar procesos que han llegado
                procesosRestantes = procesosRestantes.filter(p => {
                    if (p.llegada <= tiempo) {
                        p.estado = 'listo';
                        listos.push(p);
                        return false;
                    }
                    return true;
                });

                // Verificar procesos bloqueados
                bloqueados = bloqueados.filter(p => {
                    if (p.bloqueoHasta <= tiempo) {
                        p.estado = 'listo';
                        listos.push(p);
                        return false;
                    }
                    return true;
                });
            }

            while (procesosRestantes.length > 0 || listos.length > 0 ||
                bloqueados.length > 0 || procesoActual !== null) {

                actualizarColas();

                // Ordenar por tiempo de ejecución restante
                listos.sort((a, b) => a.ejecucionRestante - b.ejecucionRestante);

                // Verificar si hay un proceso más corto que el actual
                if (procesoActual !== null && listos.length > 0 &&
                    listos[0].ejecucionRestante < procesoActual.ejecucionRestante) {
                    listos.push(procesoActual);
                    procesoActual = null;
                    listos.sort((a, b) => a.ejecucionRestante - b.ejecucionRestante);
                }

                // Seleccionar próximo proceso a ejecutar
                if (procesoActual === null && listos.length > 0) {
                    procesoActual = listos.shift();
                    procesoActual.estado = 'ejecutando';

                    // Registrar tiempo de respuesta (primera vez)
                    if (procesoActual.tiempoRespuesta === null) {
                        procesoActual.tiempoRespuesta = tiempo - procesoActual.llegada;
                    }
                }

                // Ejecutar proceso actual
                if (procesoActual !== null) {
                    // Verificar si debe bloquearse en este ciclo
                    const bloque = procesoActual.bloques[procesoActual.bloqueActual];
                    const ejecutadoHastaAhora = procesoActual.ejecucionTotal - procesoActual.ejecucionRestante;

                    if (bloque && ejecutadoHastaAhora >= bloque.inicio) {
                        // Bloquear el proceso
                        procesoActual.estado = 'bloqueado';
                        procesoActual.bloqueoHasta = tiempo + bloque.duracion;
                        procesoActual.tiempoBloqueo += bloque.duracion;
                        procesoActual.bloqueActual++;
                        bloqueados.push(procesoActual);

                        tiempoPlanificacion += bloque.duracion;
                        tiempo += bloque.duracion;
                        procesoActual = null;
                        continue;
                    }

                    // Ejecutar 1 unidad de tiempo
                    procesoActual.ejecucionRestante--;
                    procesoActual.vecesEjecutado++;
                    tiempoCPU++;
                    tiempo++;

                    // Verificar si terminó
                    if (procesoActual.ejecucionRestante === 0) {
                        procesoActual.instanteFin = tiempo;
                        terminados.push(procesoActual);
                        procesoActual = null;
                    }
                } else {
                    // CPU idle
                    tiempoPlanificacion++;
                    tiempo++;
                }

                // Actualizar tiempos de espera
                listos.forEach(p => {
                    p.tiempoEspera++;
                });
            }

            // Calcular estadísticas
            terminados.forEach(p => {
                const retorno = p.instanteFin - p.llegada;
                const tiempoPerdido = retorno - p.ejecucionTotal - p.tiempoBloqueo;
                const penalidad = (retorno / p.ejecucionTotal).toFixed(3);

                estadisticas.push({
                    proceso: p.id,
                    ejecucion: p.ejecucionTotal,
                    tiempoRespuesta: p.tiempoRespuesta,
                    espera: tiempoPerdido,
                    bloqueo: p.tiempoBloqueo,
                    instanteFin: p.instanteFin,
                    retorno: retorno,
                    tiempoPerdido: tiempoPerdido,
                    penalidad: penalidad
                });
            });

            // Calcular métricas globales
            const tiempoTotal = tiempo;
            const usoCPU = ((tiempoCPU / tiempoTotal) * 100).toFixed(2);
            const usoPlanificacion = ((tiempoPlanificacion / tiempoTotal) * 100).toFixed(2);

            return {
                estadisticas: estadisticas,
                tiempoTotal: tiempoTotal,
                tiempoCPU: tiempoCPU,
                tiempoPlanificacion: tiempoPlanificacion,
                usoCPU: usoCPU,
                usoPlanificacion: usoPlanificacion
            };
        }
    },

    RR: {
        nombre: "Round Robin",
        descripcion: "Asigna un quantum fijo a cada proceso en orden circular.",
        ejecutar: function (procesos, quantum) {

            let tiempo = 0;
            let listos = [];
            let bloqueados = [];
            let terminados = [];
            let procesoActual = null;
            let estadisticas = [];
            let tiempoCPU = 0;
            let tiempoPlanificacion = 0;

            // Se copia los procesos y se ordenan por orden de llegada
            let colaLlegada = procesos.map(p => new Proceso(p.id, p.llegada, p.ejecucionTotal, [...p.bloques]))
                                .sort((a,b) => a.llegada - b.llegada);

            // Tiempo de planificación para preparar el quantum
            tiempo++;
            tiempoPlanificacion++;

            while (colaLlegada.length > 0 || listos.length > 0 || bloqueados.length > 0){

                // Revisamos si llegan nuevos procesos
                while (colaLlegada.length > 0 && colaLlegada[0].llegada <= tiempo) {
                    listos.push(colaLlegada.shift());
                }

                // Revisamos si se termina algun bloqueo
                for (let i = 0; i < bloqueados.length; i++) {
                    const proceso = bloqueados[i];
                    if (tiempo >= proceso.bloqueoHasta) {
                        bloqueados.splice(i, 1);
                        proceso.estado = 'listo';
                        listos.push(proceso);
                        i--;
                    }
                }

                // Si no hay procesos listos, el tiempo avanzara
                if (listos.length === 0) {
                    tiempo++;
                    tiempoPlanificacion++;
                    continue;
                }

                // Ejecutamos el primer proceso en la cola
                procesoActual = listos.shift();

                // Se calcula el tiempo de respuesta si es la primera vez que llega
                if (procesoActual.vecesEjecutado === 0){
                    procesoActual.tiempoRespuesta = tiempo - procesoActual.llegada;
                }

                let tiempoRestante = Math.min(quantum, procesoActual.ejecucionRestante)

                for (let i = 0; i<tiempoRestante; i++){
                    const bloque = procesoActual.bloques[procesoActual.bloqueActual];
                    let ejecutadoHastaAhora = procesoActual.ejecucionTotal - procesoActual.ejecucionRestante;

                    // Verificamos si se inicia un bloqueo
                    if (bloque && ejecutadoHastaAhora === bloque.inicio){
                        procesoActual.estado = 'bloqueado';
                        procesoActual.bloqueoHasta = tiempo + bloque.duracion;
                        procesoActual.tiempoBloqueo += bloque.duracion;
                        procesoActual.bloqueActual++;
                        bloqueados.push(procesoActual);
                        tiempo++;
                        tiempoPlanificacion++;
                        break; // Salimos del ciclo
                    }

                    // Ejecutamos una unidad de tiempo
                    procesoActual.ejecucionRestante--;
                    procesoActual.vecesEjecutado++;
                    tiempo++;
                    tiempoCPU++;
                    ejecutadoHastaAhora = procesoActual.ejecucionTotal - procesoActual.ejecucionRestante;
                    // Verificamos si llego algun proceso durante esta unidad de tiempo
                    while (colaLlegada.length > 0 && colaLlegada[0].llegada <= tiempo) {
                        listos.push(colaLlegada.shift());
                    }

                    // Se revisa si termino algun bloqueo durante esta unidad de tiempo
                    for (let j = 0; j < bloqueados.length; j++) {
                        const p = bloqueados[j];
                        if (tiempo >= p.bloqueoHasta) {
                            bloqueados.splice(j, 1);
                            p.estado = 'listo';
                            listos.push(p);
                            j--;
                        }
                    }

                    if (procesoActual.ejecucionRestante === 0) {
                        break;
                    }else if (bloque && ejecutadoHastaAhora === bloque.inicio){
                        procesoActual.estado = 'bloqueado';
                        procesoActual.bloqueoHasta = tiempo + bloque.duracion;
                        procesoActual.tiempoBloqueo += bloque.duracion;
                        procesoActual.bloqueActual++;
                        bloqueados.push(procesoActual);
                        tiempo++;
                        tiempoPlanificacion++;
                        break; // Salimos del ciclo
                    }
                }

                // Si termino su ejecucion
                if (procesoActual.ejecucionRestante === 0) {
                    procesoActual.instanteFin = tiempo;
                    tiempo++;
                    tiempoPlanificacion++;
                    
                    terminados.push(procesoActual);
                } 

                if (procesoActual.ejecucionRestante > 0 && procesoActual.estado !== "bloqueado") {

                    tiempo++;
                    tiempoPlanificacion++;
                
                    listos.push(procesoActual);
                }
                
            }
            tiempo--;
            tiempoPlanificacion--;
            // Calcular estadísticas
            terminados.forEach(p => {
                const retorno = p.instanteFin - p.llegada;
                const tiempoPerdido = retorno - p.ejecucionTotal - p.tiempoBloqueo;
                const penalidad = (retorno / p.ejecucionTotal).toFixed(2);
                estadisticas.push({
                    proceso: p.id,
                    ejecucion: p.ejecucionTotal,
                    espera: tiempoPerdido,
                    bloqueo: p.tiempoBloqueo,
                    instanteFin: p.instanteFin,
                    retorno: retorno,
                    tiempoPerdido: tiempoPerdido,
                    penalidad: penalidad,
                    tiempoRespuesta: p.tiempoRespuesta
                });
            });

            estadisticas.sort((a, b) => a.proceso.localeCompare(b.proceso));

            const tiempoTotal = tiempo;
            const usoCPU = ((tiempoCPU / tiempoTotal) * 100).toFixed(2);
            const usoPlanificacion = ((tiempoPlanificacion / tiempoTotal) * 100).toFixed(2);

            return {
                estadisticas: estadisticas,
                tiempoTotal: tiempoTotal,
                tiempoCPU: tiempoCPU,
                tiempoPlanificacion: tiempoPlanificacion,
                usoCPU: usoCPU,
                usoPlanificacion: usoPlanificacion
            };
        }
    },

};

// Función para mostrar resultados
function mostrarResultados(resultados, algoritmo) {
    const resultadosSection = document.getElementById('resultados');
    resultadosSection.style.display = 'block';

    // Mostrar información del algoritmo
    document.getElementById('algorithm-name').textContent = Algoritmos[algoritmo].nombre;
    document.getElementById('algorithm-desc').textContent = Algoritmos[algoritmo].descripcion;

    // Mostrar tabla de resultados
    const tablaBody = document.getElementById('cuerpo-tabla');
    tablaBody.innerHTML = '';

    let sumaRetorno = 0;
    let sumaEjecucion = 0;
    let sumaEspera = 0;
    let sumaPerdido = 0;
    let sumaPenalidad = 0;

    resultados.estadisticas.forEach(est => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${est.proceso}</td>
            <td>${est.ejecucion}</td>
            <td>${est.tiempoRespuesta}</td>
            <td>${est.espera}</td>
            <td>${est.bloqueo}</td>
            <td>${est.instanteFin}</td>
            <td>${est.retorno}</td>
            <td>${est.tiempoPerdido}</td>
            <td>${est.penalidad}</td>
        `;
        tablaBody.appendChild(row);

        // Acumular para promedios
        sumaRetorno += est.retorno;
        sumaEjecucion += est.ejecucion;
        sumaEspera += est.espera;
        sumaPerdido += est.tiempoPerdido;
        sumaPenalidad += parseFloat(est.penalidad);
    });

    // Calcular métricas globales
    const totalProcesos = resultados.estadisticas.length;

    // Mostrar métricas globales
    document.getElementById('tiempo-total').textContent = resultados.tiempoTotal;
    document.getElementById('uso-cpu').textContent = `${resultados.usoCPU}%`;
    document.getElementById('cpu-procesamiento').textContent = `${resultados.usoPlanificacion}%`;
    document.getElementById('prom-retorno').textContent = totalProcesos > 0 ? (sumaRetorno / totalProcesos).toFixed(2) : "0";
    document.getElementById('prom-ejecucion').textContent = totalProcesos > 0 ? (sumaEjecucion / totalProcesos).toFixed(2) : "0";
    document.getElementById('prom-espera').textContent = totalProcesos > 0 ? (sumaEspera / totalProcesos).toFixed(2) : "0";
    document.getElementById('prom-penalidad').textContent = totalProcesos > 0 ? (sumaPenalidad / totalProcesos).toFixed(3) : "0";

    // Desplazarse a la sección de resultados
    resultadosSection.scrollIntoView({ behavior: 'smooth' });
}

// Funciones de la interfaz (sin cambios)
function agregarProceso() {
    const container = document.getElementById('proceso-inputs');
    const id = 'P' + (container.children.length + 1);

    const procesoDiv = document.createElement('div');
    procesoDiv.className = 'proceso-row';
    procesoDiv.innerHTML = `
        <div class="proceso-cell">
            <strong>${id}</strong>
        </div>
        <div class="proceso-cell">
            <input type="number" class="llegada" min="0" value="0">
        </div>
        <div class="proceso-cell">
            <input type="number" class="ejecucion" min="1" value="5">
        </div>
        <div class="bloques-container">
            <div class="bloque-row">
                <button onclick="agregarBloque(this)" class="btn-bloque">
                    <i class="fas fa-plus"></i> Bloque
                </button>
            </div>
        </div>
        <div class="proceso-cell">
            <button onclick="eliminarProceso(this)" class="btn-remove">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    container.appendChild(procesoDiv);
}

function agregarBloque(button) {
    const bloqueContainer = button.parentElement.parentElement;
    const bloqueDiv = document.createElement('div');
    bloqueDiv.className = 'bloque-row';
    bloqueDiv.innerHTML = `
        <input type="number" class="inicio-bloque" min="0" value="0" placeholder="Inicio">
        <input type="number" class="duracion-bloque" min="1" value="1" placeholder="Duración">
        <button onclick="eliminarBloque(this)" class="btn-remove">
            <i class="fas fa-times"></i>
        </button>
    `;

    bloqueContainer.insertBefore(bloqueDiv, button.parentElement);
}

function eliminarBloque(button) {
    button.parentElement.remove();
}

function eliminarProceso(button) {
    const container = document.getElementById('proceso-inputs');
    if (container.children.length > 1) {
        button.closest('.proceso-row').remove();
        renumerarProcesos();
    } else {
        alert('Debe haber al menos un proceso');
    }
}

function renumerarProcesos() {
    const procesos = document.querySelectorAll('.proceso-row');
    procesos.forEach((proceso, index) => {
        proceso.querySelector('strong').textContent = 'P' + (index + 1);
    });
}

function limpiarProcesos() {
    document.getElementById('proceso-inputs').innerHTML = '';
    siguienteId = 1;
}

function simular() {
    // Obtener algoritmo y quantum
    const algoritmo = document.getElementById('algoritmo').value;
    const quantum = parseInt(document.getElementById('quantum').value) || 5;

    // Obtener procesos de la interfaz
    const procesos = [];
    const procesoEntries = document.querySelectorAll('.proceso-row');

    procesoEntries.forEach(entry => {
        const id = entry.querySelector('strong').textContent;
        const llegada = parseInt(entry.querySelector('.llegada').value) || 0;
        const ejecucion = parseInt(entry.querySelector('.ejecucion').value) || 1;

        // Obtener bloques
        const bloques = [];
        const bloqueEntries = entry.querySelectorAll('.bloque-row');

        bloqueEntries.forEach(bloque => {
            const inicioInput = bloque.querySelector('.inicio-bloque');
            const duracionInput = bloque.querySelector('.duracion-bloque');

            if (inicioInput && duracionInput) {
                const inicio = parseInt(inicioInput.value) || 0;
                const duracion = parseInt(duracionInput.value) || 1;
                bloques.push({ inicio, duracion });
            }
        });
        procesos.push(new Proceso(id, llegada, ejecucion, bloques));
    });

    // Validar que haya al menos un proceso
    if (procesos.length === 0) {
        alert('Debe haber al menos un proceso para simular');
        return;
    }

    // Ejecutar simulación con el algoritmo seleccionado
    let resultados;
    if (algoritmo === 'RR') {
        resultados = Algoritmos.RR.ejecutar(procesos, quantum);
    } else {
        resultados = Algoritmos[algoritmo].ejecutar(procesos);
    }
    console.log(resultados)

    // Mostrar resultados
    mostrarResultados(resultados, algoritmo);
}

// Inicializar con un proceso al cargar
window.onload = function () {
    agregarProceso();
};