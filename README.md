# Control Administrativo de Asistencias (Z ai)

Sistema institucional de gestión de asistencia escolar desarrollado con **React 19**, **TypeScript** y **Gemini AI**. Diseñado para un entorno administrativo de alta exigencia (High-End UI).

## 🚀 Características Principales

- **Gestión de Roles**: Administradores (Control Total) y Docentes (Control de Aula).
- **Control de Matrícula**: Gestión de estudiantes por grado, sección y turno (Mañana/Tarde).
- **Importación Inteligente**: Carga masiva de estudiantes vía CSV con limpieza de datos.
- **Reportes Institucionales**:
  - Consolidado diario de asistencia.
  - Matriz mensual lineal con auditoría de totales.
  - Formatos optimizados para impresión física (Landscape).
- **Z ai (Inteligencia Artificial)**: 
  - Análisis de patrones de deserción.
  - Redacción de informes narrativos y memorándums.
  - Asistente de consulta sobre protocolos legales y educativos.

## 🛠️ Stack Tecnológico

- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **Gráficos**: Recharts.
- **Iconografía**: Lucide React.
- **IA**: Google Gemini API (@google/genai).
- **Persistencia**: LocalStorage API (Arquitectura Serverless).

## 📦 Instalación y Desarrollo

Este proyecto utiliza **Vite**. Para ejecutarlo localmente:

1. Clonar el repositorio.
2. Instalar dependencias: `npm install`
3. Configurar la API Key de Gemini en un archivo `.env`:
   ```env
   VITE_GEMINI_API_KEY=tu_clave_aqui
   ```
4. Iniciar servidor de desarrollo: `npm run dev`

## 📄 Estructura del Proyecto

- `/src/components`: Componentes de interfaz (Layout, etc).
- `/src/screens`: Pantallas principales (Dashboards, Gestión, Reportes).
- `/src/services`: Lógica de almacenamiento y conexión con Gemini API.
- `/src/types.ts`: Definiciones de tipos para TypeScript.

## ⚖️ Licencia
Este proyecto es de uso institucional educativo.

---
*Desarrollado con el apoyo de Z ai Assistant.*
