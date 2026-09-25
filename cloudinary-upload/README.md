# cloudinary-upload

Módulo reutilizable para subir archivos a Cloudinary desde el frontend.

## Configuración

1. Crear cuenta en https://cloudinary.com
2. Ir a **Settings > Upload > Upload presets > Add upload preset**
   - Mode: **Unsigned**
   - Folder: (opcional, ej: `inquilinoverificado`)
   - Signing Mode: **Unsigned**
3. Copiar el **Cloud name** y el **Upload preset name**

## Uso en cualquier proyecto

```js
import { uploadToCloudinary } from './cloudinary-upload';

const url = await uploadToCloudinary(file, 'carpeta_opcional');
```
