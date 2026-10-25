import {test} from "node:test";
import assert from "node:assert/strict";
import {area,makeLayout,seedProject,validateProject} from "../lib/domain.ts";
test("survey scale converts polygon area to square feet",()=>{
  assert.equal(area([[0,0],[10,0],[10,10],[0,10]],1),1076);
  assert.equal(area([[0,0],[0,10],[10,10],[10,0]],1),1076);
  assert.equal(area([[0,0],[10,0],[10,10],[0,10]],2),4306);
});
test("layout generation creates unique labelled plots and valid geometry",()=>{
  const d={...seedProject(),...makeLayout(8,6)};validateProject(d);
  assert.equal(d.plots.length,48);assert.equal(new Set(d.plots.map(p=>p.number)).size,48);
  assert.ok(d.plots.every(p=>p.points.length===4&&p.area>0));
});
test("invalid, duplicate, nonfinite and unbounded geometry is rejected",()=>{
  const d=seedProject();d.plots[1].number=d.plots[0].number;assert.throws(()=>validateProject(d),/unique/);
  const e=seedProject();e.plots[0].points[0][0]=Infinity;assert.throws(()=>validateProject(e),/coordinates/);
  const f=seedProject();f.metersPerUnit=0;assert.throws(()=>validateProject(f),/scale/);
  const g=seedProject();g.plots[0].price=-1;assert.throws(()=>validateProject(g),/Invalid plot/);
});
