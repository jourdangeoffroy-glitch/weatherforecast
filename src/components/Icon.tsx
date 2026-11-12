import add from '@material-symbols/svg-400/rounded/add.svg?raw';
import del from '@material-symbols/svg-400/rounded/delete.svg?raw';
import back from '@material-symbols/svg-400/rounded/arrow_back.svg?raw';
import ext from '@material-symbols/svg-400/rounded/open_in_new.svg?raw';
import download from '@material-symbols/svg-400/rounded/download.svg?raw';
import upload from '@material-symbols/svg-400/rounded/upload.svg?raw';
import landscape from '@material-symbols/svg-400/rounded/landscape.svg?raw';
import city from '@material-symbols/svg-400/rounded/location_city.svg?raw';
import search from '@material-symbols/svg-400/rounded/search.svg?raw';
import close from '@material-symbols/svg-400/rounded/close.svg?raw';
import refresh from '@material-symbols/svg-400/rounded/refresh.svg?raw';
import drop from '@material-symbols/svg-400/rounded/water_drop.svg?raw';
import air from '@material-symbols/svg-400/rounded/air.svg?raw';
import { decrire } from '../lib/weathercode';

const UI = { add, del, back, ext, download, upload, landscape, city, search, close, refresh, drop, air };
export type IconName = keyof typeof UI;

// SVG statiques du paquet @material-symbols (pas de donnée utilisateur) : injection sûre.
const Svg = ({ svg, className, label }: { svg: string; className?: string; label?: string }) => (
  <span
    className={`icon ${className ?? ''}`}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    dangerouslySetInnerHTML={{ __html: svg }}
  />
);

export const Icon = ({ name, className }: { name: IconName; className?: string }) => <Svg svg={UI[name]} className={className} />;

export const MeteoIcon = ({ code, className }: { code: number | null; className?: string }) => {
  const d = decrire(code);
  return <Svg svg={d.svg} className={className} label={d.libelle} />;
};
