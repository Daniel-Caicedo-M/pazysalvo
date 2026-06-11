import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../services/auth.jsx';
import { api } from '../services/api.js';

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [pendientesCount, setPendientesCount] = useState(0);

  useEffect(() => {
    if (!usuario) return;
    api.actasPendientes()
      .then(({ actas }) => setPendientesCount(actas.length))
      .catch(() => {});
  }, [usuario]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
           <svg viewBox="0 0 24000.000000 9010.000000" className="w-15 h-10" fill="#2e12cf" >

              <path d="M2000 3507 l0 1498 1495 -1495 c822 -822 1495 -1496 1495 -1497 0 -2-673 -3 -1495 -3 l-1495 0 0 1497z" />
              <path d="M5500 3515 l-1495 1495 1498 0 1497 0 0 -1495 c0 -822 -1 -1495 -3 -1495 -1 0 -675 673 -1497 1495z" />
              <path d="M9765 2627 c-303 25 -565 91 -760 191 -259 133 -416 321 -477 571 -30 121 -29 332 1 446 56 211 182 359 401 474 234 122 434 171 990 241 446 56 595 77 734 107 245 51 384 110 461 195 61 68 78 126 73 243 -3 83 -8 101 -41 168 -89 180 -312 300 -662 354 -173 27 -539 24 -710 -6 -395 -69 -652 -232 -772 -489 -28 -60 -62 -176 -63 -215 0 -4 -117 -7 -261 -7 l-260 0 7 57 c8 70 45 203 79 283 102 243 321 468 585 600 359 180 888 248 1450 184 664 -75 1078 -349 1165 -770 22 -106 20 -292 -4 -386 -84 -327

-379 -522 -961 -638 -58 -11 -298 -45 -534 -75 -574 -73 -743 -109 -926 -198 -112 -54

-197 -137 -229 -222 -20 -52 -22 -75 -19 -165 3 -89 8 -114 31 -164 91 -197 309 -314

672 -362 154 -21 503 -14 645 11 404 72 679 284 731 561 7 32 13 65 15 71

3 10 63 13 259 13 140 0 255 -4 255 -9 0 -4 -7 -47 -15 -94 -76 -434 -413 -763

-919 -897 -222 -58 -425 -81 -711 -78 -104 1 -208 3 -230 5z"/>

              <path d="M12130 2920 l0 250 255 0 255 0 0 -250 0 -250 -255 0 -255 0 0 250z" />

              <path d="M14213 3481 c-620 72 -1032 409 -1143 935 -27 129 -37 372 -21

513 63 539 394 911 934 1051 180 47 310 62 527 63 209 1 315 -12 475

-58 380 -111 680 -366 815 -693 15 -37 30 -79 34 -95 l6 -27 -237 0 -238 0 -38 80

c-138 286 -471 431 -918 399 -406 -29 -658 -169 -796 -443 -36 -71 -83 -235 -83

-287 l0 -29 1186 0 1187 0 -6 -163 c-14 -404 -128 -686 -371 -914 -190 -178 -440 -287

-753 -328 -123 -16 -436 -18 -560 -4z m467 364 c237 35 429 135 545 283 82

104 152 261 170 385 l7 47 -930 0 c-530 0 -933 -4 -936 -9 -8 -12 28 -147 58

-221 39 -98 86 -170 162 -246 163 -165 403 -251 709 -253 66 0 163 6 215 14z"/>

              <path d="M17255 3476 c-245 28 -358 51 -508 104 -156 55 -247 110 -348

210 -93 92 -135 163 -164 275 -18 69 -20 221 -4 297 36 173 169 319

369 405 189 81 351 111 863 158 422 39 551 55 677 86 227 57 322 144

322 297 0 153 -84 247 -277 311 -126 42 -288 61 -518 61 -300 0 -460

-31 -653 -126 -168 -82 -304 -220 -337 -341 l-11 -43 -243 0 -243 0 0 23 c0 42 40

180 70 246 61 130 185 270 319 360 120 81 298 154 470 191 379 83

924 74 1297 -20 206 -52 346 -124 459 -235 79 -80 135 -179 156 -280 16 -79 16 -236

-1 -305 -61 -257 -291 -408 -735 -480 -66 -11 -289 -36 -495 -55 -415 -39 -572 -62

-703 -100 -215 -62 -303 -149 -301 -297 2 -179 172 -306 484 -364 119 -21 401 -29 530

-15 392 45 600 192 655 463 l5 28 245 0 245 0 0 -38 c0 -63 -37 -191 -79 -277

-148 -299 -478 -480 -976 -535 -82 -9 -499 -12 -570 -4z"/>



              <path d="M20310 3481 c-175 20 -351 64 -488 121 -219 91 -411 281 -486

480 -23 60 -56 198 -56 233 0 13 31 15 249 15 l248 0 7 -49 c16 -122 121

-258 252 -328 172 -92 374 -128 659 -120 364 11 561 70 688 205 91 99 127 205

127 383 l0 116 -377 7 c-444 8 -659 19 -878 47 -479 59 -776 187 -918

395 -26 38 -56 95 -67 128 -56 165 -44 379 30 526 101 201 309 329

625 386 140 25 449 25 599 0 355 -59 711 -219 941 -425 l40 -35 3 217 2 217

245 0 245 0 0 -808 c0 -861 -3 -923 -50 -1063 -111 -328 -371 -529 -794 -614 -67 -13

-170 -29 -230 -34 -127 -13 -507 -12 -616 0z m1200 1442 c0 53 -28 145 -66

218 -151 287 -511 479 -975 519 -259 23 -518 -37 -641 -148 -106 -95 -118

-253 -27 -356 136 -155 570 -235 1379 -255 157 -4 295 -8 308 -9 19 -2 22 3 22 31z"/>

              <path d="M12150 4855 l0 1155 230 0 230 0 0 -1155 0 -1155 -230 0 -230 0 0

1155z"/>

              <path d="M2000 6007 l0 998 995 -995 c547 -547 995 -996 995 -997 0 -2 -448 -3

-995 -3 l-995 0 0 997z"/>



              <path d="M6000 6015 l-995 995 998 0 997 0 0 -995 c0 -547 -1 -995 -3 -995 -1 0

-450 448 -997 995z"/>
</svg>
            <span className="font-semibold text-brand">Siesa</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-6">
            <Link to="/" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-ink-soft">Actas</Link>
            <Link to="/pendientes" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-ink-soft inline-flex items-center gap-1.5">
              Pendientes
              {pendientesCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-brand text-white text-[10px] font-medium rounded-full">
                  {pendientesCount}
                </span>
              )}
            </Link>
            {(usuario?.rol === 'admin' || usuario?.rol === 'rrhh') && (
              <Link to="/recordatorios" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-ink-soft">Recordatorios</Link>
            )}
            {usuario?.rol === 'admin' && (
              <>
                <Link to="/documentos" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-ink-soft">Documentos</Link>
                <Link to="/usuarios" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-ink-soft">Usuarios</Link>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            {usuario && (
              <>
                <div className="text-right hidden sm:block">
                  <div className="font-medium text-ink">{usuario.nombre}</div>
                  <div className="text-xs text-muted font-mono">{usuario.rol}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-ink"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
