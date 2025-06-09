// Lista de imágenes de fondo disponibles
const backgroundImages = [
  '/images/backgrounds/adrian-infernus-GLf7bAwCdYg-unsplash.jpg',
  '/images/backgrounds/milad-fakurian-tGTa40GKSRI-unsplash.jpg',
  '/images/backgrounds/pawel-czerwinski-qzaIDFtzcZ0-unsplash.jpg'
];

// Función para obtener una imagen de fondo aleatoria del directorio local
export const getRandomDocumentImage = () => {
  try {
    if (backgroundImages.length === 0) {
      throw new Error('No hay imágenes de fondo disponibles');
    }
    
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    const imagePath = backgroundImages[randomIndex];
    
    console.log('Using local background image:', imagePath);
    return imagePath;
  } catch (error) {
    console.error('Error in getRandomDocumentImage:', error);
    return '/images/backgrounds/milad-fakurian-tGTa40GKSRI-unsplash.jpg'; // Imagen por defecto
  }
};

export default {
  getRandomDocumentImage
}; 