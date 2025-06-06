<template>
    <div>
        <div v-if="this.authStore.userPermissions.some(item => item.nombre === 'appMovil')" class="app-wrapper">
            <!-- Topbar -->
            <div class="topbar">
                <button class="logout-btn" @click="logout">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>
            <!-- Contenedor principal -->
            <div class="app-download-container">
                <img :src="logo" alt="Logo" class="logo" />
                <h1>Descarga la App Móvil</h1>
                <p>¡Disfruta de la mejor experiencia en tu móvil!</p>
                <button @click="downloadApk" class="btn btn-primary download-btn" :disabled="downloading">
                    <i class="bi bi-download"></i> 
                    {{ downloading ? 'Descargando...' : 'Descargar APK' }}
                </button>
                <div v-if="downloadError" class="alert alert-danger mt-3">
                    {{ downloadError }}
                </div>
            </div>
        </div>
        <div v-else class="app-wrapper">
            <div class="topbar">
                <button class="logout-btn" @click="logout">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>
            <div class="app-download-container">
                <img :src="logo" alt="Logo" class="logo" />
                <h1>Acceso no autorizado</h1>
                <p>No tienes permiso para acceder a esta sección.</p>
                <p>Por favor, contacta a tu administrador.</p>
            </div>
        </div>
    </div>
</template>

<script>
import logo from "@/assets/img/siglo.png";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/services/api";

// Importar la APK desde assets (puede fallar en producción)
let apkFromAssets;
try {
    apkFromAssets = import.meta.glob('/src/assets/apps/bodegapp.apk');
} catch (error) {
    console.log('APK no encontrada en assets');
}

export default {
    name: "AppMovilDownload",
    data() {
        return {
            logo,
            downloadError: null,
            downloading: false,
            publicApkPath: '/apk/bodegapp.apk' // Ruta a la APK en public
        };
    },
    computed: {
        authStore() {
            return useAuthStore();
        },
        hasPWAPermission() {
            return this.authStore.permissions.some(item => item.nombre === 'appMovil');
        }
    },
    methods: {
        async downloadApk() {
            try {
                this.downloading = true;
                this.downloadError = null;

                // Primero intentar con la APK en assets
                if (apkFromAssets) {
                    try {
                        const apkModule = await apkFromAssets['/src/assets/apps/bodegapp.apk']();
                        if (apkModule.default) {
                            this.downloadFile(apkModule.default);
                            return;
                        }
                    } catch (error) {
                        console.log('Error al cargar APK desde assets:', error);
                    }
                }

                // Si falla assets, intentar con la APK en public
                try {
                    const response = await fetch(this.publicApkPath);
                    if (response.ok) {
                        const blob = await response.blob();
                        this.downloadFile(URL.createObjectURL(blob));
                        return;
                    }
                } catch (error) {
                    console.log('Error al cargar APK desde public:', error);
                }

                // Si ambos métodos fallan, intentar con el backend
                const response = await apiClient.get('/api/apk/download', {
                    responseType: 'blob',
                    headers: {
                        'Authorization': `Bearer ${this.authStore.token}`
                    }
                });

                const blob = new Blob([response.data], {
                    type: 'application/vnd.android.package-archive'
                });
                this.downloadFile(URL.createObjectURL(blob));

            } catch (error) {
                console.error('Error al descargar la APK:', error);
                this.downloadError = 'Error al descargar la APK. Por favor, intenta nuevamente.';
            } finally {
                this.downloading = false;
            }
        },

        downloadFile(url) {
            // En dispositivos móviles, abrir en una nueva pestaña
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                window.open(url, '_blank');
            } else {
                // En desktop, usar el método de descarga tradicional
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'bodegapp.apk');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Limpiar la URL creada
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
        },

        logout() {
            this.authStore.resetAuth();
            localStorage.clear();
            this.$router.replace({ name: "Login" });
        }
    }
};
</script>

<style scoped>
.app-wrapper {
    display: flex;
    flex-direction: column;
    height: 100dvh;
}

.topbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 10px 20px;
    background-color: #f8f9fa;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
}

.logout-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    color: #007bff;
}

.logout-btn:hover {
    color: #0056b3;
}

.app-download-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    /* Se agrega margen superior para evitar el topbar */
    margin-top: 60px;
    background: radial-gradient(circle at top left, #ffffff, #e9ecef);
}

.logo {
    width: 200px;
    margin-bottom: 20px;
}

h1 {
    font-size: 32px;
    color: #222;
    margin-bottom: 12px;
    text-align: center;
}

p {
    font-size: 18px;
    color: #444;
    margin-bottom: 30px;
    text-align: center;
}

.btn {
    display: inline-flex;
    align-items: center;
    font-size: 18px;
    padding: 14px 28px;
    text-decoration: none;
    color: #fff;
    background-color: #007bff;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 123, 255, 0.3);
    transition: background-color 0.3s, transform 0.2s;
}

.btn:hover {
    background-color: #0056b3;
    transform: translateY(-3px);
}

.btn i {
    margin-right: 8px;
}

@media (max-width: 600px) {
    .app-download-container {
        padding: 30px 20px;
    }
}

@media (max-width: 480px) {
    h1 {
        font-size: 24px;
    }

    p {
        font-size: 16px;
    }

    .btn {
        font-size: 16px;
        padding: 12px 20px;
    }
}

.download-btn {
    padding: 12px 24px;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 8px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

.download-btn:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.download-btn:active {
    transform: translateY(0);
}

.download-btn i {
    font-size: 1.2rem;
}

.download-btn:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
    transform: none;
}

.download-btn:disabled:hover {
    background-color: #6c757d;
    transform: none;
    box-shadow: none;
}
</style>
