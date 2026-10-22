---
name: crear-variante
description: Crea una variante (ejemplo de documentación) de un componente int-* en Intelica Components. Pregunta el componente, el título y la descripción de la variante, genera version-N/variants/<slug>/example.ts + example.html y la deja visible en el menú y en la página. Úsalo cuando el usuario diga "crea una variante", "agrega la variante X a <componente>", "nuevo ejemplo de <componente>" o /crear-variante.
argument-hint: "[componente] [título de la variante]"
---

# Crear una variante

Genera la carpeta `src/components/<componente>/version-<N>/variants/<slug>/` con un `example.ts` y un
`example.html` mínimos, listos para que el maquetador escriba el ejemplo. Sustituye a copiar y
renombrar a mano la variante de otro componente.

## 0. Validar antes de preguntar

Con lo que dio el usuario, comprueba **antes de preguntar el resto**:

1. **Que el componente exista**: carpeta `src/components/<id>/` (o `_<id>_/`) o un `title:` que coincida
   en `src/components/*/version-*/base/*.html`. Si no existe, **no se crea nada** y se responde:

   > No se puede crear la variante: el componente **<nombre>** no existe.
   > Primero créalo con `/crear-componente`.

   Si el nombre se parece a uno existente (`Buton` → `button`), sugiérelo y pregunta si era ese.
2. **Que la versión exista** (si pidió una): `version-<N>/` dentro del componente. Si no, avisar con las
   versiones disponibles.
3. **Que la variante no exista**: en cuanto se sepa el título, su carpeta
   `version-<N>/variants/<slug>/` (slug en kebab-case: `Icons + Border` → `icons-border`). Si existe,
   **no se crea nada** y se responde:

   > No se puede crear **<Título>**: la variante ya existe en `<id>` (`version-<N>/variants/<slug>/`).
   > Para cambiar su título o descripción, edita la cabecera de su `example.html`.

El script hace las mismas comprobaciones y falla sin tocar nada; si aun así falla, traduce su error
al usuario con estos mensajes.

## 1. Datos

Hay que saber tres cosas. Lo que venga en los argumentos (`/crear-variante accordion Icons + Border`)
o en el mensaje no se vuelve a preguntar; lo que falte se pregunta en el chat, **todo en un solo mensaje**:

1. **Componente**: el ID o el nombre visible (`accordion`, `Dropdown / Select`). Para ver los
   disponibles: el `id` de `src/components/*/<id>.config.ts` y el `title:` de la cabecera de su
   `version-N/base/<id>.html`. Conviértelo siempre al `id`.
2. **Título** de la variante: el nombre visible tal como aparece en la referencia (Excel/Figma):
   `Basic`, `Icons + Border`, `Raised`.
3. **Descripción** de la variante: una línea (`Raised buttons display a shadow to indicate
   elevation.`). Puede quedar vacía si el usuario no la tiene.

La versión es la más reciente (`version-N` mayor), salvo que el usuario pida otra.
Cuando se llama desde `crear-componente`, el componente ya se conoce: solo se preguntan título y descripción.

Sobre `basic`:
- Todo componente nuevo ya trae `variants/basic/` (la crea `crear-componente`). Si piden "Basic" y
  ya existe, el script falla: para cambiar su título o descripción, editar la cabecera de su `example.html`.
- Si el componente es anterior a esta convención y no tiene `basic`, se puede crear con
  `npm run new:variant -- <id> Basic --description "…"`.

## 2. Generar

```bash
npm run new:variant -- <id> "<Título>" --description "<Descripción>" [--version <N>]
```

El script:
- calcula el slug con la misma regla que la documentación (`Icons + Border` → `icons-border`,
  `RadioButton` → `radio-button`);
- lee la clase de `version-N/base/<id>.ts` (`IntAccordion`);
- crea `example.ts` (clase `<Id><Slug>Example`, selector `<id>-<slug>-example`, importa solo la base);
- crea `example.html` **solo con la cabecera** (título y descripción) y nada debajo:
  ```html
  <!--
    title: Raised
    description: Raised buttons display a shadow to indicate elevation.
  -->
  ```
- falla sin tocar nada si el componente, la versión o la base no existen, o si la carpeta ya existe;
- al terminar regenera `src/generated/`, así la sección aparece aunque el servidor sea un `ng serve` directo.
  Después, editar el título, la descripción o el ejemplo se refleja al instante (no hace falta regenerar).

La página muestra el título y la descripción en la sección, y "Preview pending" con la ruta del
`example.html` mientras el HTML esté vacío o solo tenga comentarios (el maquetador escribe el ejemplo debajo de la cabecera). Mientras tanto
Angular avisa `NG8113: All imports are unused`; es esperado.

No escribas los archivos a mano ni copies los de otra variante: usa el script.

## 3. Posición en el menú

El título y la descripción **no van en `<id>.config.ts`** ni en ningún `.ts`: se editan en la cabecera
de `example.html`. La carpeta nueva aparece sola en el menú y en la página: `basic` primero y el resto en
orden alfabético, o **después** de las listadas si el config ya tiene `variants`.

Si el componente queda con **3 o más variantes** (o el usuario pidió una posición), sigue la skill
`ordenar-variantes`:

1. `npm run order:variants -- <id>` y pega la tabla en el chat, marcando la variante nueva.
2. Pregunta si la deja en esa posición o en cuál la quiere. Por defecto queda donde está: si el usuario
   no pide otra, no se toca el config.
3. Si pide otra: `npm run order:variants -- <id> <slugs en el orden nuevo>` (todas las variantes).

Con 1 o 2 variantes no preguntes, salvo que el usuario mencione una posición.

## 4. Verificar

```bash
npm run build    # el script ya registró la carpeta en src/generated; no hace falta npm run docs
```

Confirma al usuario la ruta creada y el enlace: `/components/<id>#<id>-<slug>`.

## Qué NO hacer

- ❌ Escribir el ejemplo (marcado, inputs, datos) debajo de la cabecera: lo hace el maquetador.
- ❌ Poner el título o la descripción en `<id>.config.ts` u otro `.ts`.
- ❌ Crear módulos SCSS de modificador (`_<id>.<mod>.scss`) ni tocar `base/`: una variante de
  documentación no es un modificador. Solo se crean si el usuario los pide explícitamente.
- ❌ Cambiar el `status` del componente al agregar una variante: lo decide el maquetador con la skill
  `cambiar-estado`.
- ❌ Tocar `<id>-page.ts`, `routes.ts`, `inventory.ts` ni `src/generated/`.
- ❌ Inventar variantes que el usuario no pidió.
- ❌ Crear el componente por tu cuenta cuando no existe: se avisa y lo crea el usuario con `/crear-componente`.
- ❌ Sobrescribir, renombrar o "reutilizar" una variante que ya existe.
- ❌ Agregar una variante solo en `variants` del config sin crear su carpeta: no se muestra.

Convenciones completas: skill `crear-componente` (`.claude/skills/crear-componente/SKILL.md`,
sección 3.0 "Preguntar antes de crear" y sección 4 "Agregar un ejemplo").
