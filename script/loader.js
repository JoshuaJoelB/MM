(async () => {
  const files = [
    '../Assets/sound/bg music1.mp3',
    '../Assets/sound/bg%20music1.mp3',
    '../Assets/sound/epp/lvl 1/Google.mp3',
    '../Assets/sound/epp/lvl%201/Google.mp3',
    '../Assets/sound/epp/lvl2/search button.mp3',
    '../Assets/sound/epp/lvl2/search%20button.mp3'
  ];
  for (const url of files) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      console.log(r.ok ? '✅' : '❌', r.status, url);
    } catch (e) {
      console.log('❌ ERR', url);
    }
  }
})();