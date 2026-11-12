export class Transaccion {
    static historial = [];

    constructor(tipo, descripcion, monto, categoria, fecha) {
        if (!['ingreso', 'gasto'].includes(tipo)) {
            throw new Error("Tipo de transacción inválido. Debe ser 'ingreso' o 'gasto'.");
        }

        if (!descripcion || descripcion.trim() === '') {
            throw new Error("La descripción no puede estar vacía.");
        }

        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            throw new Error("El monto debe ser un número mayor a 0.");
        }

        if (!categoria || categoria.trim() === '') {
            throw new Error("Debe seleccionar una categoría válida.");
        }

        if (!fecha || fecha.trim() === '') {
            throw new Error("Debe seleccionar una fecha válida.");
        }

        this.id = Date.now() + Math.random();
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.monto = parseFloat(monto);
        this.categoria = categoria;
        this.fecha = fecha;

        Transaccion.historial.push(this);
    }
}