# ATELIER — Arquitectura educativa

Sitio institucional y portafolio, en español, creado en HTML, CSS y JavaScript sin dependencias.

## Abrir la página

Abre index.html directamente en el navegador. También puedes ejecutar desde esta carpeta:

    node preview.mjs

Luego visita http://127.0.0.1:5500. Detén el servidor con Ctrl+C.

## Contenido y estructura

- Portada con ilustración arquitectónica conceptual original.
- Presentación del estudio y valores basados en la información proporcionada.
- Servicios de diseño, planificación y remodelación, con desplegables.
- Proyecto realizado: colegio ALTIORA.
- Enfoque: sostenibilidad, flexibilidad, inclusión y bienestar.
- Navegación móvil y galería con miniaturas, ampliación, teclado y deslizamiento.

La ilustración de portada es conceptual; no representa el colegio ALTIORA.
La galería incluye los 34 renders proporcionados del colegio ALTIORA, clasificados en 15 exteriores y 19 interiores. Cada vista tiene un título y texto alternativo descriptivos. Los renders se muestran completos, sin recortar su composición.

## Agregar el logo y los renders

1. Guarda el logo PNG en assets/ y configura su ruta en config.js, en logo.
2. Guarda los renders PNG o JPG en assets/colegio/exteriores/ o assets/colegio/interiores/.
3. Agrega entradas al arreglo project.images en config.js. Por ejemplo:

    { src: "assets/colegio/exteriores/fachada.jpg", category: "exteriores", alt: "Descripción de la fachada real", caption: "Fachada principal" }

La galería sustituye automáticamente el espacio reservado cuando hay imágenes configuradas.
Usa descripciones reales y conserva los originales; para la web conviene optimizar copias.

## Categorías de la galería

Los filtros Exteriores e Interiores muestran únicamente sus imágenes, miniaturas y contador.
El cambio automático, las flechas y la vista ampliada recorren la categoría seleccionada.
Al cambiar de categoría se muestra su primera imagen y se reinicia el intervalo de 6 segundos.
La pausa elegida por el visitante se conserva al cambiar de categoría.
Cada entrada de project.images incluye category: "exteriores" o "interiores".
project.defaultCategory indica la categoría inicial. Agrega las nuevas imágenes a config.js;
la página estática no lee automáticamente el contenido de las carpetas.

## Cambio automático de imágenes

La galería cambia de render cada 6 segundos mientras está visible.
Puedes pausar o reanudar con el botón de la galería. El avance se suspende
al ampliar una imagen, al cambiar de pestaña y al salir de la sección.
Al volver a la galería o cerrar la ampliación, comienza un intervalo completo.
La navegación manual también reinicia el intervalo. El acceso por teclado pausa
el cambio y las preferencias de movimiento reducido desactivan su inicio automático.

Para cambiar la duración, edita project.autoplaySeconds en config.js.
Usa 0 para desactivar la reproducción automática.

## Contactos

Los datos facilitados corresponden SOLO al colegio ALTIORA:
- Teléfono: 12334566.
- Correo: ALTIORA@colegio.com.

Se muestran identificados como contacto del colegio dentro de su proyecto.
Los datos de ATELIER no se han facilitado. Para activar "Hablemos" y su sección de contacto,
completa company.email y/o company.phone en config.js.
Los enlaces de correo abren la aplicación de correo del visitante; no hay envío desde un servidor.

## Diseño adaptable y accesibilidad

Composición fluida con ajustes para móvil, tableta, laptop y escritorio.
Menú accesible con Escape, enlace para saltar al contenido, textos alternativos,
estados de foco, diálogo de galería y respeto a la preferencia de movimiento reducido.
Las fuentes son locales del sistema, para funcionar sin Internet.

## Archivos

- index.html: estructura y contenido.
- styles.css: identidad visual y adaptación a pantallas.
- config.js: logo, imágenes y contactos.
- script.js: navegación y galería.
- assets/: recursos visuales.
- preview.mjs: servidor local opcional, sin paquetes.

