const { Jimp } = require('jimp');
const path = require('path');

const closedPath = path.join(__dirname, '..', 'public', 'chest-closed.png');
const openPath = path.join(__dirname, '..', 'public', 'chest-open.png');

async function processImage(imagePath) {
    console.log(`Processing image: ${imagePath}`);
    const image = await Jimp.read(imagePath);
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    let transparentCount = 0;
    let semiTransparentCount = 0;
    
    // Soft-edge feathering parameters
    const minBlack = 12; // Pixels below this max channel value are 100% transparent
    const maxBlack = 60; // Pixels between minBlack and maxBlack fade smoothly
    
    image.scan(0, 0, width, height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        const maxVal = Math.max(r, g, b);
        
        if (maxVal < minBlack) {
            // 100% transparent
            this.bitmap.data[idx + 3] = 0;
            transparentCount++;
        } else if (maxVal < maxBlack) {
            // Smooth soft-edge fade
            const ratio = (maxVal - minBlack) / (maxBlack - minBlack);
            this.bitmap.data[idx + 3] = Math.round(ratio * 255);
            semiTransparentCount++;
        }
    });
    
    await image.write(imagePath);
    console.log(`Finished processing: ${transparentCount} fully transparent pixels, ${semiTransparentCount} semi-transparent feathered pixels.`);
}

async function run() {
    try {
        await processImage(closedPath);
        await processImage(openPath);
        console.log("Image soft-edge feathering complete!");
        process.exit(0);
    } catch (e) {
        console.error("Error processing images:", e);
        process.exit(1);
    }
}

run();
