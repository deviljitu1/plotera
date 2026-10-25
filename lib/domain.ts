export type Point = [number, number];
export type PlotStatus = "available" | "reserved" | "sold";
export type Plot = { id: string; number: string; points: Point[]; status: PlotStatus; area: number; price: number; facing: string; building: boolean };
export type Road = { id: string; name: string; points: Point[]; width: number };
export type Amenity = { id: string; name: string; type: "park" | "pool" | "clubhouse" | "gate"; x: number; y: number };
export type Document = { name: string; key: string; type: string };
export type ProjectData = {
  name: string; location: string; description: string; developer: string; accent: string;
  plots: Plot[]; roads: Road[]; amenities: Amenity[]; documents: Document[];
  mapKey?: string; modelKey?: string; audioKey?: string; metersPerUnit: number;
  contactEmail: string; contactPhone: string; rera: string;
};
export type Project = { id: string; name: string; data: ProjectData; version: number; published?: string | null; shareToken?: string | null; plan?: string; invoiceStatus?: string; invoiceAmount?: number; updated: number };
export function area(points: Point[], scale = .3048) {
  return Math.round(Math.abs(points.reduce((n, p, i) => { const q = points[(i + 1) % points.length]; return n + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2 * scale * scale * 10.7639);
}
export function makeLayout(rows = 6, columns = 4): Pick<ProjectData, "plots" | "roads" | "amenities"> {
  const plots: Plot[] = [], width = Math.min(120, 600 / columns), height = Math.min(68, 420 / rows);
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const x = 100 + col * (width + 15) + (col >= Math.ceil(columns / 2) ? 100 : 0), y = 150 + row * (height + 9), n = row * columns + col + 1;
    const points: Point[] = [[x,y],[x+width,y],[x+width,y+height],[x,y+height]];
    plots.push({ id: crypto.randomUUID(), number: `A-${String(n).padStart(2, "0")}`, points, status: "available", area: area(points), price: 4200000 + n * 25000, facing: col < columns / 2 ? "East" : "West", building: false });
  }
  const mid = 100 + Math.ceil(columns / 2) * (width + 15) + 43;
  return { plots, roads: [{ id: crypto.randomUUID(), name: "Palm Avenue · 12 m", width: 50, points: [[mid,95],[mid,650]] },{ id: crypto.randomUUID(), name: "Entrance boulevard · 18 m", width: 65, points: [[60,650],[850,650]] }], amenities: [{id:crypto.randomUUID(),name:"The Green",type:"park",x:220,y:90},{id:crypto.randomUUID(),name:"Residents’ club",type:"clubhouse",x:620,y:85},{id:crypto.randomUUID(),name:"Pool deck",type:"pool",x:740,y:90},{id:crypto.randomUUID(),name:"Main entrance",type:"gate",x:mid,y:680}] };
}
export function seedProject(): ProjectData {
  const layout = makeLayout();
  layout.plots.forEach((p,i) => { p.status = [3,9,14,21].includes(i) ? "sold" : [5,12,19].includes(i) ? "reserved" : "available"; p.building = [3,9,14,21].includes(i); });
  return { name: "Boulevard Estate", location: "New Raipur, Chhattisgarh", description: "A little more room to live. Thoughtfully planned residences, tree-lined avenues, and a neighbourhood that feels like home.", developer: "Your development studio", accent: "#476650", ...layout, documents: [], metersPerUnit: .3048, contactEmail: "", contactPhone: "", rera: "" };
}
export function validateProject(d: ProjectData) {
  if (!d || typeof d.name !== "string" || !d.name.trim() || d.name.length > 100) throw new Error("Project name must be 1–100 characters.");
  if (!Number.isFinite(d.metersPerUnit) || d.metersPerUnit <= 0 || d.metersPerUnit > 1000) throw new Error("Map scale must be greater than zero.");
  if (!Array.isArray(d.plots) || d.plots.length > 500 || !Array.isArray(d.roads) || d.roads.length > 100 || !Array.isArray(d.amenities) || d.amenities.length > 100) throw new Error("Layout exceeds supported limits.");
  const ids = new Set<string>(), nums = new Set<string>();
  for (const p of d.plots) {
    if (!p.id || ids.has(p.id) || !p.number || nums.has(p.number)) throw new Error("Plot IDs and numbers must be unique.");
    ids.add(p.id); nums.add(p.number);
    if (!["available","reserved","sold"].includes(p.status) || !Number.isFinite(p.price) || p.price < 0 || !Number.isFinite(p.area) || p.area <= 0 || p.points.length < 3 || p.points.length > 100) throw new Error("Invalid plot details.");
    validatePoints(p.points);
  }
  for (const road of d.roads) { validatePoints(road.points); if (road.points.length < 2 || !Number.isFinite(road.width) || road.width <= 0 || road.width > 200) throw new Error("Invalid road."); }
  for (const a of d.amenities) if (!["park","pool","clubhouse","gate"].includes(a.type) || !Number.isFinite(a.x) || !Number.isFinite(a.y)) throw new Error("Invalid amenity.");
  if (!Array.isArray(d.documents) || d.documents.length > 30 || !/^#[0-9a-f]{6}$/i.test(d.accent)) throw new Error("Invalid project settings.");
  return d;
}
function validatePoints(points: Point[]) { for (const p of points) if (!Array.isArray(p) || p.length !== 2 || p.some(n => !Number.isFinite(n) || Math.abs(n) > 10000)) throw new Error("Invalid map coordinates."); }
export function money(n: number) { return n >= 10000000 ? `₹${(n/10000000).toFixed(2)} Cr` : n >= 100000 ? `₹${(n/100000).toFixed(2)} L` : `₹${n.toLocaleString("en-IN")}`; }
