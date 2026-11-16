// usage: node export.js <startFrame> <endFrame|count> <out.mp4|-> [fps] [mode]
// mode "bench" : mesure seulement
const {chromium}=require('playwright'); const {spawn}=require('child_process');
(async()=>{
 const [,, a, b, out, fpsS='24'] = process.argv; const fps=+fpsS; const start=+a, end=+b;
 const br=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await br.newPage({viewport:{width:1280,height:720}});
 p.on('pageerror',e=>console.log('PAGEERR',e.message.slice(0,300)));
 await p.goto('http://localhost:8765/index.html?export=1'); await p.waitForFunction('window.__ready',null,{timeout:120000});
 await p.evaluate(()=>{document.getElementById('loader').style.display='none'});
 let t0=Date.now();
 await p.evaluate(([n,f])=>window.__api.ffTo(n,f),[start,fps]);
 console.log('ff',start,'frames in',(Date.now()-t0)/1000,'s');
 let ff=null;
 if(out!=='-'){ ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']}); }
 t0=Date.now(); let n=0;
 for(let f=start; f<end; f++){
   const fin=await p.evaluate((dt)=>{ if(window.__finished) return 1; window.__api.step(dt); window.__api.render(); return 0;},1/fps);
   if(fin) break;
   const buf=await p.screenshot({type:'jpeg',quality:92});
   if(ff){ if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r)); }
   n++; if(n%100===0) console.log(`frame ${f} (${n} done) ${((Date.now()-t0)/1000/n).toFixed(2)} s/frame`);
 }
 console.log('rendered',n,'frames in',(Date.now()-t0)/1000,'s',((Date.now()-t0)/1000/Math.max(1,n)).toFixed(3),'s/frame');
 if(ff){ ff.stdin.end(); await new Promise(r=>ff.on('close',r)); }
 await br.close();
})();
