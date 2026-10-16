/* MUSA / Creative challenge artwork. Generated client-side: no image calls or stored user data. */
(function(){
  'use strict';
  const variants=[
    {title:'FORMAS EN LIBERTAD',subtitle:'01 / GEOMETRÍA',motif:'shapes',colors:['#3926CE','#FF7049','#D7FF42','#E8E6DE']},
    {title:'CAMBIA EL ÁNGULO',subtitle:'02 / PERSPECTIVA',motif:'perspective',colors:['#211B36','#8AA5F7','#FF7049','#E8E6DE']},
    {title:'IDEAS EN MOVIMIENTO',subtitle:'03 / RITMO',motif:'waves',colors:['#3926CE','#D7FF42','#8AA5F7','#F5F0E7']},
    {title:'TODO SE TRANSFORMA',subtitle:'04 / COLLAGE',motif:'fragments',colors:['#211B36','#FF7049','#CDB9F3','#D7FF42']},
    {title:'MENOS REGLAS',subtitle:'05 / EXPERIMENTACIÓN',motif:'orbits',colors:['#8AA5F7','#211B36','#D7FF42','#F5F0E7']},
    {title:'BUSCA LO INESPERADO',subtitle:'06 / EXPLORACIÓN',motif:'arches',colors:['#FF7049','#3926CE','#E8E6DE','#D7FF42']},
    {title:'PRUEBA OTRA FORMA',subtitle:'07 / COMPOSICIÓN',motif:'steps',colors:['#3926CE','#E8E6DE','#FF7049','#8AA5F7']},
    {title:'SAL DE LO COMÚN',subtitle:'08 / CONTRASTE',motif:'stripes',colors:['#211B36','#D7FF42','#8AA5F7','#FF7049']}
  ];
  function select(){
    let prev=-1;
    try{prev=Number(sessionStorage.getItem('musa-explore-art-last'));}catch(_e){}
    const available=variants.map((_,i)=>i).filter(i=>i!==prev);
    const idx=available[Math.floor(Math.random()*available.length)];
    try{sessionStorage.setItem('musa-explore-art-last',String(idx));}catch(_e){}
    return {index:idx,...variants[idx]};
  }
  // A different composition is selected on page load; in-app rerenders keep the same art.
  const active=select();
  const pathMap={
    shapes:'<circle cx="122" cy="114" r="101" fill="B"/><path d="M0 188 L168 18 L296 118 L296 260 L0 260Z" fill="C"/><circle cx="230" cy="66" r="49" fill="D"/><path d="M38 238 L186 45 L276 238Z" fill="A"/>',
    perspective:'<path d="M-18 0H312L170 260H-18Z" fill="B"/><path d="M128 0H292V260H0Z" fill="C"/><path d="M0 225L297 65V260H0Z" fill="D"/><circle cx="185" cy="85" r="58" fill="A"/>',
    waves:'<rect x="0" y="0" width="300" height="260" fill="A"/><path d="M-20 200C60 35 120 335 313 45" stroke="C" stroke-width="46" fill="none"/><path d="M-24 268C54 84 167 350 315 129" stroke="B" stroke-width="32" fill="none"/><circle cx="240" cy="65" r="40" fill="D"/>',
    fragments:'<path d="M0 0H148L86 131L0 100Z" fill="B"/><path d="M148 0H300V144L85 132Z" fill="C"/><path d="M0 102L154 175L64 260H0Z" fill="D"/><path d="M300 144V260H63L155 175Z" fill="B"/><circle cx="173" cy="130" r="52" fill="A"/>',
    orbits:'<circle cx="148" cy="130" r="112" stroke="B" stroke-width="39" fill="none"/><circle cx="148" cy="130" r="69" stroke="C" stroke-width="30" fill="none"/><circle cx="148" cy="130" r="26" fill="D"/><path d="M-10 235L310 34" stroke="D" stroke-width="28"/>',
    arches:'<path d="M-20 260V110a82 82 0 0 1 164 0v150Z" fill="B"/><path d="M106 260V70a95 95 0 0 1 190 0v190Z" fill="C"/><path d="M142 260V130a55 55 0 0 1 110 0v130Z" fill="D"/><circle cx="90" cy="56" r="37" fill="A"/>',
    steps:'<rect x="0" y="0" width="300" height="260" fill="D"/><path d="M0 260V180H80V111H160V44H300V260Z" fill="B"/><path d="M0 260V223H94V152H177V81H300V260Z" fill="C"/><circle cx="210" cy="70" r="54" fill="A"/>',
    stripes:'<path d="M-80 0L45 0L-100 260H-225Z" fill="B"/><path d="M15 0H95L-50 260H-130Z" fill="C"/><path d="M135 0H208L65 260H-9Z" fill="B"/><path d="M245 0H318L175 260H100Z" fill="D"/><circle cx="212" cy="117" r="75" fill="A"/>'
  };
  function svg(motif,palette,secondary=false){
    const source=pathMap[motif]||pathMap.shapes;
    const art=source.replace(/(fill|stroke)="([ABCD])"/g,(_m,k,v)=>k+'="'+palette[v.charCodeAt(0)-65]+'"');
    const transform=secondary?'<g transform="rotate(30 150 130) scale(.95 1.04)">'+art+'</g>':art;
    return '<svg viewBox="0 0 300 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">'+
      '<rect width="300" height="260" fill="'+palette[0]+'"/>'+transform+'</svg>';
  }
  function render(){
    const p=active.colors;
    const reverse=[p[1],p[3],p[2],p[0]];
    return '<div class="musa-challenge-banner mcb-layout-'+(active.index%3)+'" aria-label="Banner de inspiración creativa: '+active.title.toLocaleLowerCase('es')+'">'+
      '<div class="mcb-mosaic">'+
        '<div class="mcb-feature">'+svg(active.motif,p)+'</div>'+
        '<div class="mcb-side">'+svg(active.motif,reverse,true)+'</div>'+
        '<div class="mcb-micro"><span class="mcb-micro-label">MUSA / LAB</span><svg class="mcb-brand-mark" aria-hidden="true" focusable="false"><use href="#musa-mark-icon"></use></svg></div>'+
        '<div class="mcb-caption"><span>'+active.subtitle+'</span><strong>'+active.title+'</strong></div>'+
        '<div class="mcb-palette" aria-hidden="true">'+p.map(color=>'<i style="background:'+color+'"></i>').join('')+'</div>'+
      '</div></div>';
  }
  window.MusaChallengeBanner=Object.freeze({render});
})();