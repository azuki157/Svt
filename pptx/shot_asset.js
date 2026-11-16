const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const [m,w,h] of [['sperm',2400,520],['male',1400,1400],['uterus',1800,1300]]){
 const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto(`http://localhost:8765/_t_assets.html?m=${m}&light=1`);await p.waitForFunction('window.DONE',null,{timeout:90000});
 await p.screenshot({path:`assets/${m}.png`,omitBackground:true});console.log(m);await p.close();}
await b.close();})();
