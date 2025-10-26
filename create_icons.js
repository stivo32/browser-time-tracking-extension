const fs = require('fs');
const path = require('path');

// Создаем простые PNG файлы (минимальные заголовки PNG)
function createSimplePNG(size) {
    // Простой PNG с синим квадратом
    const width = size;
    const height = size;
    
    // PNG заголовок
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // bit depth
    ihdrData[9] = 2; // color type (RGB)
    ihdrData[10] = 0; // compression
    ihdrData[11] = 0; // filter
    ihdrData[12] = 0; // interlace
    
    const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
    const ihdrChunk = Buffer.concat([
        Buffer.from([0, 0, 0, 13]), // length
        Buffer.from('IHDR'),
        ihdrData,
        Buffer.from([
            (ihdrCrc >> 24) & 0xFF,
            (ihdrCrc >> 16) & 0xFF,
            (ihdrCrc >> 8) & 0xFF,
            ihdrCrc & 0xFF
        ])
    ]);
    
    // IDAT chunk (минимальные данные)
    const idatData = Buffer.alloc(width * height * 3);
    for (let i = 0; i < idatData.length; i += 3) {
        idatData[i] = 66;     // R
        idatData[i + 1] = 133; // G  
        idatData[i + 2] = 244; // B
    }
    
    const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), idatData]));
    const idatChunk = Buffer.concat([
        Buffer.from([0, 0, 0, idatData.length]), // length
        Buffer.from('IDAT'),
        idatData,
        Buffer.from([
            (idatCrc >> 24) & 0xFF,
            (idatCrc >> 16) & 0xFF,
            (idatCrc >> 8) & 0xFF,
            idatCrc & 0xFF
        ])
    ]);
    
    // IEND chunk
    const iendCrc = crc32(Buffer.from('IEND'));
    const iendChunk = Buffer.concat([
        Buffer.from([0, 0, 0, 0]), // length
        Buffer.from('IEND'),
        Buffer.from([
            (iendCrc >> 24) & 0xFF,
            (iendCrc >> 16) & 0xFF,
            (iendCrc >> 8) & 0xFF,
            iendCrc & 0xFF
        ])
    ]);
    
    return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

// Простая CRC32 функция
function crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ 0xEDB88320;
            } else {
                crc >>>= 1;
            }
        }
    }
    return crc ^ 0xFFFFFFFF;
}

// Создаем папку для иконок
const iconsDir = path.join(__dirname, 'dist', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Создаем иконки разных размеров
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
    const pngData = createSimplePNG(size);
    const filename = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(filename, pngData);
    console.log(`Created icon${size}.png`);
});

console.log('All icons created successfully!');
