import { Transaccion } from './classes/Transaccion.js';

const form = document.getElementById('form-transaccion');
const selectTipo = document.getElementById('tipo');
const selectCategoria = document.getElementById('categoria');
const inputFecha = document.getElementById('fecha');
const errorMessageElem = document.getElementById('error');
const btnEliminarUltimo = document.getElementById('btn-eliminar-ultimo');

let chartCategorias = null;
let chartEvolucion = null;

const categoriasPorTipo = {
    ingreso: ['Sueldo', 'Ventas', 'Extras'],
    gasto: ['Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Otros']
};

function cargarFechaHoy() {
    if (inputFecha) {
        inputFecha.value = new Date().toISOString().split('T')[0];
    }
}

function actualizarCategorias() {
    if (!selectTipo || !selectCategoria) return;

    const tipoSeleccionado = selectTipo.value;
    const opciones = categoriasPorTipo[tipoSeleccionado] || [];
    
    selectCategoria.innerHTML = '';
    opciones.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectCategoria.appendChild(option);
    });
}

selectTipo.addEventListener('change', actualizarCategorias);

function guardarEnLocalStorage() {
    localStorage.setItem('historialTransacciones', JSON.stringify(Transaccion.historial));
}

function cargarDesdeLocalStorage() {
    const datosGuardados = localStorage.getItem('historialTransacciones');
    if (datosGuardados) {
        const transacciones = JSON.parse(datosGuardados);
        Transaccion.historial = [];

        transacciones.forEach(t => {
            const nuevaT = new Transaccion(t.tipo, t.descripcion, t.monto, t.categoria, t.fecha);
            nuevaT.id = t.id;
        });
    }
}

//  Botón Eliminar
if (btnEliminarUltimo) {
    btnEliminarUltimo.addEventListener('click', () => {
        if (Transaccion.historial.length > 0) {
            Transaccion.historial.pop(); 
            guardarEnLocalStorage();
            actualizarInterfaz();
        } else {
            alert("No hay movimientos registrados para eliminar.");
        }
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault(); 
    
    const descripcion = document.getElementById('descripcion').value.trim();
    const montoStr = document.getElementById('monto').value;
    const fecha = inputFecha.value; 
    const tipo = selectTipo.value;
    const categoria = selectCategoria.value;

    try {
        new Transaccion(tipo, descripcion, montoStr, categoria, fecha);
        
        guardarEnLocalStorage();
        actualizarInterfaz();
        form.reset();
        cargarFechaHoy();
        actualizarCategorias();

        if (errorMessageElem) {
            errorMessageElem.textContent = '';
            errorMessageElem.classList.add('hidden'); 
        } 

    } catch (error) {
        if (errorMessageElem) {
            errorMessageElem.textContent = error.message;
            errorMessageElem.classList.remove('hidden'); 
        } else {
            alert(error.message);
        }
    }
});

function actualizarGraficoCategorias() {
    const canvasElem = document.getElementById('graficoCategorias');
    if (!canvasElem) return;
    const ctx = canvasElem.getContext('2d');

    const categoriasTotales = {};
    const coloresFondo = [];
    const coloresBorde = [];

    Transaccion.historial.forEach(t => {
        if (!categoriasTotales[t.categoria]) {
            categoriasTotales[t.categoria] = 0;
        }
        categoriasTotales[t.categoria] += t.monto;
    });

    const labels = Object.keys(categoriasTotales);
    const datos = Object.values(categoriasTotales);

    labels.forEach(cat => {
        const esIngreso = ['Sueldo', 'Ventas', 'Extras'].includes(cat);
        if (esIngreso) {
            coloresFondo.push('rgb(16, 186, 129)');
            coloresBorde.push('rgb(5, 150, 105)');
        } else {
            coloresFondo.push('rgb(220, 38, 38)');
            coloresBorde.push('rgb(220, 38, 38)');
        }
    });

    if (chartCategorias) {
        chartCategorias.destroy();
    }

    chartCategorias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monto por Categoría',
                data: datos,
                backgroundColor: coloresFondo,
                borderColor: coloresBorde,
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function actualizarGraficoEvolucion() {
    const canvasElem = document.getElementById('graficoEvolucion');
    if (!canvasElem) return;
    const ctx = canvasElem.getContext('2d');

    if (chartEvolucion) {
        chartEvolucion.destroy();
    }

    if (Transaccion.historial.length === 0) return;

    const transaccionesOrdenadas = [...Transaccion.historial].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const fechas = [...new Set(transaccionesOrdenadas.map(t => t.fecha))];
    
    const ingresosData = [];
    const gastosData = [];
    const balanceData = [];

    let acumuladoIngresos = 0;
    let acumuladoGastos = 0;

    fechas.forEach(fecha => {
        const transaccionesFecha = transaccionesOrdenadas.filter(t => t.fecha === fecha);
        
        transaccionesFecha.forEach(t => {
            if (t.tipo === 'ingreso') {
                acumuladoIngresos += t.monto;
            } else {
                acumuladoGastos += t.monto;
            }
        });

        ingresosData.push(acumuladoIngresos);
        gastosData.push(acumuladoGastos);
        balanceData.push(acumuladoIngresos - acumuladoGastos);
    });

    chartEvolucion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [
                {
                    label: 'Ingresos Acumulados',
                    data: ingresosData,
                    borderColor: 'rgb(5, 150, 105)',
                    backgroundColor: 'rgba(5, 150, 105,0.08)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Gastos Acumulados',
                    data: gastosData,
                    borderColor: 'rgb(220, 38, 38)',
                    backgroundColor: 'rgba(244, 63, 94,0.05)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Balance Neto',
                    data: balanceData,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function actualizarInterfaz() {
    actualizarGraficoCategorias();
    actualizarGraficoEvolucion();
}

 document.addEventListener('DOMContentLoaded', () => {
    cargarDesdeLocalStorage();    
    actualizarCategorias();       
    cargarFechaHoy();             
    actualizarInterfaz();         
});     









