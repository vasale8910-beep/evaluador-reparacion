# Evaluador de Reparación

App web gratuita para decidir si conviene reparar un equipo: se eligen las piezas a reemplazar sobre el plano y la app compara el costo con el valor del equipo nuevo.

- **App:** `index.html`, `app.js`, `estilos.css`
- **Datos (lo único que se edita):** `datos/equipos.json`
- **Planos:** carpeta `planos/`

---

## 1. Publicarla por primera vez (una sola vez, desde el computador)

1. Entra a **github.com** → *Sign up* y crea la cuenta con tu correo de Hotmail. Elige el plan **Free**.
2. Arriba a la derecha, **+** → **New repository**.
   - Nombre: `evaluador-reparacion`
   - Marca **Public**. Con la cuenta gratis, GitHub Pages solo publica repositorios públicos.
   - Presiona **Create repository**.
3. En el repositorio nuevo, toca el enlace **uploading an existing file**.
4. Descomprime el ZIP en tu computador y **arrastra todo el contenido de la carpeta** (los archivos y las carpetas `datos` y `planos`) a la página de GitHub. Luego presiona **Commit changes**.
5. Ve a **Settings** → **Pages**.
   - En *Source* elige **Deploy from a branch**.
   - En *Branch* elige **main** y **/(root)**, y presiona **Save**.
6. Espera uno o dos minutos y recarga esa misma página. Arriba aparece el enlace de la app:
   `https://TU-USUARIO.github.io/evaluador-reparacion/`

Ese enlace es el que compartes con todo el equipo.

## 2. Instalarla en el celular

- **Android (Chrome):** abre el enlace → menú **⋮** → **Instalar app** o **Agregar a la pantalla principal**.
- **iPhone (Safari):** abre el enlace → botón **Compartir** → **Agregar a inicio**.

Queda con su ícono, como cualquier app, y siempre muestra los precios más recientes.

## 3. Cambiar un precio

1. En GitHub, abre `datos` → `equipos.json`.
2. Toca el **lápiz** (Edit this file).
3. Busca la pieza con **Ctrl + F** (por ejemplo `RN-S53F-36A`) y cambia el número que está después de `"precio":`.
   - Sin signo `$` y sin puntos de miles. Los decimales van con punto: `207619.99`
4. Cambia también `"actualizado"` (arriba del archivo) por la fecha de hoy, por ejemplo `"2026-11-03"`.
5. Presiona **Commit changes** → **Commit changes**.
6. En uno o dos minutos todos ven el precio nuevo al abrir la app.

Otros datos que puedes cambiar del mismo modo:

| Campo | Qué es | Ejemplo |
|---|---|---|
| `"valorReposicion"` | Valor del equipo nuevo | `18995292` |
| `"umbral"` | % máximo de reparación frente al equipo nuevo | `60` |
| `"cantidad"` | Unidades de la pieza | `2` |
| `"precio": 0` | Oculta la pieza: las piezas sin precio no se muestran | `0` |

> Si después de un cambio la app dice que no pudo cargar los datos, casi siempre falta una coma o sobra una. En GitHub abre el archivo → **History** → abre la versión anterior para comparar, o pídele a Claude que lo revise pegando el archivo.

## 4. Agregar un equipo nuevo

Sube el plano a la carpeta `planos/` y pásale a Claude la lista de piezas con precios. Te devolverá el `equipos.json` actualizado, con los números marcados en el plano, para que lo reemplaces con **Add file → Upload files**.

## Quién puede cambiar qué

- **Ver y usar la app:** cualquiera que tenga el enlace. No necesita cuenta.
- **Cambiar precios, piezas o equipos:** solo tú, con tu cuenta de GitHub.
- Lo que cada persona marca se guarda solo en su celular y no afecta a los demás.
