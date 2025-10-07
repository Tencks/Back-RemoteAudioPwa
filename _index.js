// import pkg from "native-sound-mixer";
// const { default: SoundMixer, DeviceType } = pkg;

// const devices = SoundMixer.devices;

// for (const device of devices) {
//   console.log("Device:", device.name, "| Volume:", device.volume, "| Type:", device.type);


//   for (const session of device.sessions) {
//     console.log("  App:", session.name, "| Volume:", session.volume);
//   }
// }

// //FUNCIONANDO DESDE LA CONSOLA
// import readline from "readline";
// import pkg from "native-sound-mixer";
// const { default: SoundMixer } = pkg;

// const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// const devices = SoundMixer.devices;
// devices.forEach((d, i) => console.log(`[${i}] ${d.name} | Vol: ${d.volume.toFixed(2)}`));

// rl.question("Seleccioná número de device: ", num => {
//   const d = devices[num];
//   console.log(`Controlando: ${d.name}`);
//   rl.question("Nuevo volumen (0-1): ", v => {
//     d.volume = parseFloat(v);
//     console.log(`✅ Volumen actualizado: ${d.volume.toFixed(2)}`);
//     rl.close();
//   });
// });
