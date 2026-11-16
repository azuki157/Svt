const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:2400,height:700}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/_t_assets.html?light=1');await p.waitForFunction('window.DONE',null,{timeout:90000});
const N=14, period=2*Math.PI/9;
for(let i=0;i<N;i++){await p.evaluate(t=>window.setT(t),i*period/N);await p.screenshot({path:`assets/sf3/f${String(i).padStart(3,'0')}.png`,omitBackground:true});}
console.log('ok');await b.close();})();
