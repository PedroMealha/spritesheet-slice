class SpriteSetup {
   constructor(defs) {
      this.POS = 'pos';
      this.PREPEND = 'pre';
      this.REGEX_NUMERAL = /[^\d\.]+/g;
      this.SLICE_ATT = 'slice-name';
      this.SVG_PATH_ID = 'pathSVG';
      this.usedPathsArray = [];
      this.clipPathId = 0;

      this.imgTemplateId = 'tmp-slice';
      Object.assign(this, defs);
      this.$imgTemplate = this.getImgTemplate(this.imgTemplateId);
      this.pImgsLoaded = createUnwrapPromise();
      try {
         const $slices = this.$slices = this.getSlices(this.container);
         this.preProcess($slices);
      } catch (err) {
         console.error(err);
      }
   }

   getImgTemplate(id) {
      const $template = document.querySelector(`#${id}`);
      const foundTemplate = $template !== null;
      if (foundTemplate)
         return $template;
      else {
         const html = `<template id="${id}"><img noscale></template>`;
         document.body.insertAdjacentHTML('beforeend', html);
         return document.querySelector(`#${id}`);
      }
   }

   getSlices(container) {
      const selector = (container ? container + ' ' : '') + `[${this.SLICE_ATT}]`;
      let $slices = $t.q(selector);
      if ($slices.length === undefined)
         $slices = new Array($slices);
      else if ($slices === null || $slices.length === 0)
         throw new Error('SPRITESETUP No slices found in HTML');
      return $slices;
   }

   preProcess($slices) {
      this.imgLoadCount = 0;
      $slices.forEach($slice => {
         const sliceName = $slice.getAttribute(this.SLICE_ATT);
         $slice.data = this.getSliceData(sliceName, this.sources);
         this.setPathSVG($slice, sliceName);
         $slice.size = this.getSliceSize($slice);
         const img = $slice.data.img;
         const $img = img.$e = this.createSliceImg(img.src);
         $slice = this.appendSliceImg($img, $slice);
      });
      return $slices;
   }

   setPathSVG($slice, sliceName) {
      if (Object.keys($slice.data.rect).includes('d')) {
         const $svgPath = document.querySelector(`#${this.SVG_PATH_ID}`);
         const foundSvgPath = $svgPath !== null;
         if (!foundSvgPath)
            this.createPathSVG($slice);
         else {
            if (this.usedPathsArray.includes(sliceName) === false) {
               this.usedPathsArray.push(sliceName);
               this.createPathDefs($slice, sliceName);
            }
         }
      }
   }

   createPathSVG($slice) {
      const rect = $slice.data.rect;
      const XMLNS = 'http://www.w3.org/2000/svg';
      const svgElem = document.createElementNS(XMLNS, 'svg')
      const svgDefs = document.createElementNS(XMLNS, 'defs')
      svgElem.setAttribute('id', this.SVG_PATH_ID);
      svgElem.setAttributeNS(null, 'viewBox', `0 0 ${rect.viewBox[2]} ${rect.viewBox[3]}`);
      svgElem.setAttributeNS(null, 'preserveAspectRatio', `xMidYMid`);
      svgElem.appendChild(svgDefs);
      svgElem.style.pointerEvents = 'none';
      document.body.appendChild(svgElem);
   }

   createPathDefs($slice, sliceName) {
      const rect = $slice.data.rect;
      const XMLNS = 'http://www.w3.org/2000/svg';
      let svgDefs = document.querySelector(`#${this.SVG_PATH_ID} defs`);
      let newPath = document.createElementNS(XMLNS, 'path')
      newPath.setAttributeNS(null, 'id', `${$slice.data.id}-path`);
      newPath.setAttributeNS(null, 'd', `${rect.d}`);
      svgDefs.appendChild(newPath);
   }

   createClipPath(pathID, clipPathID) {
      const XMLNS = 'http://www.w3.org/2000/svg';
      let svgDefs = document.querySelector(`#${this.SVG_PATH_ID} defs`);
      let newClipPath = document.createElementNS(XMLNS, 'clipPath');
      newClipPath.setAttributeNS(null, 'id', clipPathID);
      let use = document.createElementNS(XMLNS, 'use');
      use.setAttributeNS(null, 'href', `#${pathID}`);
      newClipPath.appendChild(use);
      svgDefs.appendChild(newClipPath);
   }

   getSliceData(sliceName, sources) {
      let data = {};
      let src = sources.find(s => s.slices[sliceName]);
      if (src) {
         const img = data.img = {};
         img.src = src.rgb;
         img.mask = src.mask;
         data.rect = { ...src.slices[sliceName] };
         if (Object.keys(data.rect).includes('d')) data.id = sliceName;
         data.scale = src.scale || 1;
      } else
         throw new Error(`SPRITESETUP No slice data found in sources for slice '${sliceName}'`);
      return data;
   }

   getSliceSize($e) {
      let size = {};
      const style = getComputedStyle($e);
      size.w = Number(style.width.replace(this.REGEX_NUMERAL, ''));
      size.h = Number(style.height.replace(this.REGEX_NUMERAL, ''));
      return size;
   }

   createSliceImg(src) {
      const $img = $t.q(this.$imgTemplate.content.children[0].cloneNode(true));
      $img.addEventListener('load', () => { this.handleImgLoad(); });
      $img.addEventListener('error', () => { this.handleImgError(src); });
      $img.setAttribute('src', src);
      return $img;
   }

   handleImgLoad() {
      if (++this.imgLoadCount === this.$slices.length)
         this.pImgsLoaded.selfResolve(this);
   }

   handleImgError(src) {
      this.pImgsLoaded.selfReject(new Error(`SPRITESETUP Promise pImgsLoaded rejected (${src} missing)`));
   }

   appendSliceImg($img, $slice) {
      const pos = $slice.getAttribute(this.POS);
      if (pos)
         $slice.insertBefore($img, $slice.children[pos]);
      else if ($slice.hasAttribute(this.PREPEND))
         $slice.prepend($img);
      else
         $slice.append($img);
      return $slice;
   }

   process() {
      this.$slices.forEach($slice => {
         $slice.data.rect = this.rescaleSliceRect($slice);
         this.setCSS($slice);
      });
   }

   rescaleSliceRect($slice) {
      const rect = $slice.data.rect;
      Object.keys(rect).forEach(key => {
         if (/[xywh]/.test(key))
            rect[key] *= $slice.data.scale;
      });
      return rect;
   }

   setCSS($slice) {
      const rect = $slice.data.rect;
      const img = $slice.data.img;
      const $img = img.$e;
      const nat = { w: $img.naturalWidth, h: $img.naturalHeight };
      if (rect.r) {
         rect.w = rect.r * 2;
         rect.h = rect.r * 2;
      }
      const rectNatRatio = { w: rect.w / nat.w, h: rect.h / nat.h };
      const size = $slice.size;
      let w = size.w ? size.w / rectNatRatio.w : 0;
      let h = size.h ? size.h / rectNatRatio.h : 0;

      if (!w && h) w = h * nat.w / nat.h;
      if (!h && w) h = w * nat.h / nat.w;

      w = w || nat.w;
      h = h || nat.h;

      if (!size.w) $slice.css({ width: `${w * rectNatRatio.w}px` });
      if (!size.h) $slice.css({ height: `${h * rectNatRatio.h}px` });
      if (rect.r) $slice.css({ borderRadius: `50%` });
      if (rect.d || rect.points) $slice.css({ overflow: `visible` });

      const hasSize = size.w && size.h;

      $img.css({
         top: `-${rect.y / rect.h * 100}%`,
         left: `-${rect.x / rect.w * 100}%`,
         width: `${1 / rectNatRatio.w * 100}%`,
         height: hasSize ? `${1 / rectNatRatio.h * 100}%` : '',
         webkitMaskImage: `url(${img.mask})`,
         webkitMaskSize: hasSize ? `${w}px ${h}px` : ''
      });

      if (rect.points) $img.css({ clipPath: `polygon(${rect.points})` });
      if (rect.d) {
         let sliceWidth = getComputedStyle($slice).width;
         sliceWidth = Number(sliceWidth.substring(0, sliceWidth.length - 2));

         let pathID = `${$slice.data.id}-path`;
         let clipPathID = `cp-${pathID}${this.clipPathId++}`;
         this.createClipPath(pathID, clipPathID);
         let targetClipPath = document.querySelector(`#${clipPathID}`).children[0];
         targetClipPath.setAttributeNS(null, 'transform', `scale(${sliceWidth / $slice.data.rect.w * $slice.data.scale})`);
         $img.css({ clipPath: `url(#${clipPathID})` });
      }
   }
}