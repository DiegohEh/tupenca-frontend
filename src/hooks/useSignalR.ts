import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

/**
 * Hook personalizado para manejar la conexión con el Hub de SignalR de las Pencas.
 * @param pencaInstanciaId El ID de la penca a la que nos queremos conectar.
 * @param onPencaUpdated Callback que se ejecuta cuando el servidor avisa que hay cambios.
 */
export const useSignalR = (
    pencaInstanciaId: number | undefined, 
    onPencaUpdated: () => void
) => {
    // Usamos useRef para mantener la misma instancia de la conexión viva
    // sin que React la recree cada vez que el componente se re-renderiza.
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    useEffect(() => {
        if (!pencaInstanciaId) return;

        // 1. Obtener el Slug y el Token de seguridad (Igual que como hiciste en AuthContext)
        const pathParts = window.location.pathname.split('/');
        const slug = pathParts[1];
        const token = localStorage.getItem(`authToken_${slug}`) ?? '';

        // 2. Construir la conexión hacia el backend
        // Ahora usamos VITE_HUB_URL que apunta directo a la carpeta de hubs
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${import.meta.env.VITE_HUB_URL}/penca`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect() // Si se corta el internet, intenta reconectar solo
            .build();

        // 3. Definir qué hacer cuando el servidor grita "PencaUpdated"
        connection.on("PencaUpdated", () => {
            console.log("¡El servidor avisó que hay nuevos resultados!");
            onPencaUpdated(); // Ejecutamos la función que nos pasaron por parámetro (el refetch)
        });

        // 4. Iniciar la conexión y unirnos al "cuarto" (grupo) de esta penca específica
        connection.start()
            .then(async () => {
                console.log("Conectado a SignalR - Penca Hub");
                // Le decimos al backend: "Avisame solo de las cosas de ESTA penca"
                await connection.invoke("JoinPencaGroup", pencaInstanciaId.toString());
            })
            .catch(err => console.error("Error al conectar con SignalR: ", err));

        connectionRef.current = connection;

        // 5. Cleanup: Cuando el usuario se va de la página, nos desconectamos
        return () => {
            if (connection) {
                connection.invoke("LeavePencaGroup", pencaInstanciaId.toString())
                    .then(() => connection.stop())
                    .catch(e => console.error(e));
            }
        };
    }, [pencaInstanciaId, onPencaUpdated]); // Se vuelve a ejecutar si cambia la penca
};
