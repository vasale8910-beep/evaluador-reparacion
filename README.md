<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Evaluador de Reparación</title>
<meta name="description" content="Marca las piezas a reemplazar y revisa si la reparación del equipo es viable.">
<meta name="theme-color" content="#1f5f8b">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icono-192.png">
<link rel="apple-touch-icon" href="icono-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="estilos.css">
</head>
<body>
<div class="wrap">
  <header class="top">
    <div>
      <h1>Evaluador de Reparación</h1>
      <p>Elige el equipo, marca las piezas a reemplazar y revisa si la reparación es viable.</p>
    </div>
    <div class="eqbar"><select id="eqSelect" aria-label="Equipo"></select></div>
  </header>
  <div id="loading" class="loading">Cargando equipos…</div>
  <div id="error" class="errbox" hidden></div>

  <div class="grid" id="main" hidden>
    <div class="col">
      <section class="panel">
        <h2><span>Plano del equipo</span></h2>
        <div class="stage-tools">
          <span class="zoom"><button class="btn sm" id="zOut" aria-label="Alejar">−</button><span class="num" id="zLbl">100%</span><button class="btn sm" id="zIn" aria-label="Acercar">+</button></span>
          <span class="hint">Toca un número para marcar o desmarcar la pieza.</span>
        </div>
        <div class="stage" id="stage"></div>
        <div class="legend">
          <span><i style="background:var(--bad)"></i>A reemplazar</span>
          <span><i style="background:#5f6b74"></i>No se reemplaza</span>
        </div>
      </section>

      <section class="panel">
        <h2><span>Piezas y repuestos</span><span class="muted num" id="partCount" style="font-size:14px"></span></h2>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px" class="muted">Ordenar por
          <div class="seg" id="sortSeg" style="min-width:220px"><button type="button" data-s="tag">N° plano</button><button type="button" data-s="code">N° de parte</button></div>
          <button class="btn sm" id="btnClearSel">Desmarcar todo</button>
        </div>
        <div class="tablewrap">
          <table>
            <thead><tr><th>#</th><th>Pieza</th><th></th><th class="r">Costo</th></tr></thead>
            <tbody id="partRows"></tbody>
          </table>
        </div>
      </section>
    </div>

    <div class="col">
      <section class="verdict" id="verdict" aria-live="polite"></section>
      <section class="panel">
        <h2>Datos del equipo</h2>
        <div class="row" id="infoView"></div>
        <label class="f" id="modelWrap" hidden>Modelo<select id="eqModel"></select></label>
      </section>
      <p class="hint" id="updatedLbl" style="margin:0"></p>
    </div>
  </div>
</div>
<div class="dock" id="dock"></div>
<script src="app.js"></script>
</body>
</html>
