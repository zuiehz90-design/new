import{writeFileSync,appendFileSync}from"fs";
const W=s=>appendFileSync("boutique.html",s,"utf8");
process.stdout.write("Generator running...\n");

W("<!DOCTYPE html>\n<html lang=\"fr\">\n<head>\n");
W("<meta charset=\"UTF-8\">\n");
W("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
W("<title>TOUAT TELECOM — Catalogue Smartphones</title>\n");
W("<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n");
W("<link href=\"https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">\n");
W("<style>\n");

W(`*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{--cream:#F4F1EA;--ink:#111111;--orange:#FF4B00;--acid:#C6FF00;--blue:#2B3AFF;--border:3px solid #111;--shadow:6px 6px 0 #111;--shadow-sm:4px 4px 0 #111;--font-title:"Archivo Black",sans-serif;--font-body:"Space Grotesk",sans-serif;--font-mono:"IBM Plex Mono",monospace}
html{scroll-behavior:smooth;font-size:16px}
body{background:var(--cream);color:var(--ink);font-family:var(--font-body);line-height:1.5;overflow-x:hidden}
a{color:inherit;text-decoration:none}button{cursor:pointer;font-family:inherit;border:none;background:none}
::selection{background:var(--acid);color:var(--ink)}
::-webkit-scrollbar{width:8px}::-webkit-scrollbar-track{background:var(--cream)}::-webkit-scrollbar-thumb{background:var(--ink);border:2px solid var(--cream)}
body::before{content:"";position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.015) 2px,rgba(0,0,0,0.015) 4px)}
.hatch{background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(17,17,17,0.06) 5px,rgba(17,17,17,0.06) 6px)}
`);
