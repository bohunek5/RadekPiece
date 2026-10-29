import {heatPumpProducts,buildHeatPump} from './models/heat-pumps.js';
import {boilerProducts,buildBoiler} from './models/boilers.js';

export const products=[...heatPumpProducts,...boilerProducts];
export const getProduct=id=>products.find(p=>p.id===id)||products[0];
export function buildProduct(id,state){const p=getProduct(id);return p.category==='pump'?buildHeatPump(p.id,state):buildBoiler(p.id,state);}
