# **_README_** - (•_•) #


## ⛦ SPRITESHEET (PHOTOSHOP)

### RGB:
- Ter em consideração o bleed das imagens (adicionar por baixo da imagem principal 2/3 copias com ligeiro blur)
- Exportar todos os layers (JPG)
- Filename: **XPTO**.jpg

### MASK:
- Layer principal com color overlay branco
- Exportar somente layer principal (PNG)
- Filename: **XPTO**-mask.jpg

## ⛦ SLICES (ILLUSTRATOR)

### CRIAR SLICES:
- Abrir Spritesheet (XPTO.jpg)
- Criar as slices em volta de cada elemento (Rectangle tool)
- Identificar cada layer rectângulo com o nome respetivo de cada elemento ( **!IMPORTANT!** )

### EXPORTAR CSS:
- Abrir painel CSS Properties (Window > CSS Properties)
- Seleccionar todas as slices (somente os rectângulos)
- Clicar em Generate CSS (Painel CSS Properties)
- Clicar em Export Selected CSS
- Escolher caminho onde estará o ficheiro getCSSData.js (default: "tools")
- No painel CSS Export Options, seleccionar somente
   "Pixels"
   "Include Absolute Position"
   "Include Dimentions"

## ⛦ NODE

GERAR slicesData.js .JS ATRAVÉS DO NODE:
- Ir á pasta "tools" (default) onde deverão estar todos os ficheiros CSS referentes às slices e o ficheiro getCSSData.js
- Correr o comando: 
```
node getCSSData.js
```
NOTA: Isto gera um ficheiro chamado "slicesData.js" que, por defeito, vai para a pasta common

## ⛦ HTML

- Adicionar templates
```html
<template id="tmp-slice">
	<img noscale>
</template>
```
- Criar divs com atributo "slice-name=**!ILLUSTRATOR_LAYER_NAME!**"
	- _Mudar o nome do "slice-name" é o que vai ditar qual o slice que aparece_

- No caso de se querer as IMAGENS das slices em posições especificas **dentro do seu mesmo container**, adicionar os seguintes **atributos** - (por defeito faz `append`):
	- `pre` - _prepend da imagem ao container_
	- `position="X"` - _insere a imagem na posição de "X"_

### **_EXEMPLOS (Outputs)_**:

**`Default`**
```html
<div slice-name="ABC">
	<div id="1"></div>
	<div id="2"></div>
	<div id="3"></div>
	<img />
</div>
```

**`Pre`**
```html
<div slice-name="ABC" pre>
	<img />
	<div id="1"></div>
	<div id="2"></div>
	<div id="3"></div>
</div>
```

**`Position`**
```html
<div slice-name="ABC" position="1">
	<div id="1"></div>
	<img />
	<div id="2"></div>
	<div id="3"></div>
</div>
```

## ⛦ JAVASCRIPT

```javascript
new spriteSetup({
	sources: [leaves, products] // sources from slicesData.js
});
```

## **NOTE:**
**_Disposiçao de pastas / ficheiros_**

> **IAB/common:**
> - sprite-slice.js
> - sprite-slice.less

> **IAB/common/assets:**
> - XPTO.jpg
> - XPTO-mask.png

> **IAB/tools:**
> - getCSSData.js
> - *.css