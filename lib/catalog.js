// Camera and lens catalog (popular current and recent models). Users can always type their own.
// crop = focal-length multiplier vs full frame.

export const MOUNTS = {
  'Canon RF': { crop: 1 }, 'Canon EF': { crop: 1 }, 'Nikon Z': { crop: 1 }, 'Nikon F': { crop: 1 },
  'Sony E': { crop: 1 }, 'Fujifilm X': { crop: 1.5 }, 'Fujifilm GFX': { crop: 0.79 },
  'L-mount': { crop: 1 }, 'Micro 4/3': { crop: 2 }, 'Pentax K': { crop: 1 }, 'Hasselblad X': { crop: 0.79 }, 'Leica M': { crop: 1 },
};

// [brand, [[model, mount, sensor]]]
export const CAMERA_BRANDS = [
  ['Canon', [
    ['EOS R1', 'Canon RF', 'FF'], ['EOS R3', 'Canon RF', 'FF'], ['EOS R5', 'Canon RF', 'FF'], ['EOS R5 II', 'Canon RF', 'FF'], ['EOS R6', 'Canon RF', 'FF'],
    ['EOS R6 II', 'Canon RF', 'FF'], ['EOS R8', 'Canon RF', 'FF'], ['EOS R', 'Canon RF', 'FF'], ['EOS RP', 'Canon RF', 'FF'],
    ['EOS R7', 'Canon RF', 'APS-C'], ['EOS R10', 'Canon RF', 'APS-C'], ['EOS R50', 'Canon RF', 'APS-C'],
    ['EOS 1D X Mark III', 'Canon EF', 'FF'], ['EOS 5D Mark IV', 'Canon EF', 'FF'], ['EOS 5D Mark III', 'Canon EF', 'FF'],
    ['EOS 6D Mark II', 'Canon EF', 'FF'], ['EOS 6D', 'Canon EF', 'FF'], ['EOS 90D', 'Canon EF', 'APS-C'], ['EOS 80D', 'Canon EF', 'APS-C'], ['EOS 850D', 'Canon EF', 'APS-C'],
  ]],
  ['Nikon', [
    ['Z9', 'Nikon Z', 'FF'], ['Z8', 'Nikon Z', 'FF'], ['Z7 II', 'Nikon Z', 'FF'], ['Z6 III', 'Nikon Z', 'FF'], ['Z6 II', 'Nikon Z', 'FF'], ['Z6', 'Nikon Z', 'FF'],
    ['Z5', 'Nikon Z', 'FF'], ['Zf', 'Nikon Z', 'FF'], ['Z30', 'Nikon Z', 'APS-C'], ['Z50', 'Nikon Z', 'APS-C'], ['Z50 II', 'Nikon Z', 'APS-C'], ['Zfc', 'Nikon Z', 'APS-C'],
    ['D6', 'Nikon F', 'FF'], ['D850', 'Nikon F', 'FF'], ['D810', 'Nikon F', 'FF'], ['D780', 'Nikon F', 'FF'], ['D750', 'Nikon F', 'FF'], ['D610', 'Nikon F', 'FF'],
    ['D500', 'Nikon F', 'APS-C'], ['D7500', 'Nikon F', 'APS-C'], ['D7200', 'Nikon F', 'APS-C'], ['D5600', 'Nikon F', 'APS-C'], ['D3500', 'Nikon F', 'APS-C'],
  ]],
  ['Sony', [
    ['A1', 'Sony E', 'FF'], ['A1 II', 'Sony E', 'FF'], ['A9 III', 'Sony E', 'FF'], ['A9 II', 'Sony E', 'FF'], ['A7R V', 'Sony E', 'FF'], ['A7R IV', 'Sony E', 'FF'],
    ['A7 IV', 'Sony E', 'FF'], ['A7 III', 'Sony E', 'FF'], ['A7 II', 'Sony E', 'FF'], ['A7C II', 'Sony E', 'FF'], ['A7C', 'Sony E', 'FF'], ['A7S III', 'Sony E', 'FF'],
    ['A6700', 'Sony E', 'APS-C'], ['A6600', 'Sony E', 'APS-C'], ['A6400', 'Sony E', 'APS-C'], ['A6100', 'Sony E', 'APS-C'], ['ZV-E10', 'Sony E', 'APS-C'], ['ZV-E1', 'Sony E', 'FF'], ['FX3', 'Sony E', 'FF'],
  ]],
  ['Fujifilm', [
    ['X-T5', 'Fujifilm X', 'APS-C'], ['X-T4', 'Fujifilm X', 'APS-C'], ['X-T3', 'Fujifilm X', 'APS-C'], ['X-H2', 'Fujifilm X', 'APS-C'], ['X-H2S', 'Fujifilm X', 'APS-C'],
    ['X-S20', 'Fujifilm X', 'APS-C'], ['X-S10', 'Fujifilm X', 'APS-C'], ['X-Pro3', 'Fujifilm X', 'APS-C'], ['X-E4', 'Fujifilm X', 'APS-C'], ['X100VI', 'Fujifilm X', 'APS-C'],
    ['GFX100 II', 'Fujifilm GFX', 'MF'], ['GFX100S', 'Fujifilm GFX', 'MF'], ['GFX50S II', 'Fujifilm GFX', 'MF'],
  ]],
  ['Panasonic', [
    ['Lumix S5 II', 'L-mount', 'FF'], ['Lumix S5 IIX', 'L-mount', 'FF'], ['Lumix S5', 'L-mount', 'FF'], ['Lumix S1', 'L-mount', 'FF'], ['Lumix S1R', 'L-mount', 'FF'], ['Lumix S1H', 'L-mount', 'FF'],
    ['Lumix GH6', 'Micro 4/3', 'MFT'], ['Lumix GH5 II', 'Micro 4/3', 'MFT'], ['Lumix G9 II', 'Micro 4/3', 'MFT'], ['Lumix G85', 'Micro 4/3', 'MFT'],
  ]],
  ['OM System / Olympus', [
    ['OM-1', 'Micro 4/3', 'MFT'], ['OM-1 Mark II', 'Micro 4/3', 'MFT'], ['OM-5', 'Micro 4/3', 'MFT'], ['E-M1 Mark III', 'Micro 4/3', 'MFT'], ['E-M5 Mark III', 'Micro 4/3', 'MFT'], ['E-M10 Mark IV', 'Micro 4/3', 'MFT'],
  ]],
  ['Sigma', [['fp', 'L-mount', 'FF'], ['fp L', 'L-mount', 'FF']]],
  ['Leica', [['SL3', 'L-mount', 'FF'], ['SL2', 'L-mount', 'FF'], ['Q3', 'Leica M', 'FF'], ['M11', 'Leica M', 'FF'], ['M10', 'Leica M', 'FF']]],
  ['Pentax', [['K-3 Mark III', 'Pentax K', 'APS-C'], ['KF', 'Pentax K', 'APS-C'], ['K-1 Mark II', 'Pentax K', 'FF']]],
  ['Hasselblad', [['X2D 100C', 'Hasselblad X', 'MF'], ['X1D II 50C', 'Hasselblad X', 'MF']]],
];

// [brand, model, wideMm, teleMm, maxAperture]
const LENSES = {
  'Canon RF': [
    ['Canon', 'RF 15-35mm f/2.8L IS', 15, 35, 2.8], ['Canon', 'RF 24-70mm f/2.8L IS', 24, 70, 2.8], ['Canon', 'RF 24-105mm f/4L IS', 24, 105, 4], ['Canon', 'RF 70-200mm f/2.8L IS', 70, 200, 2.8],
    ['Canon', 'RF 28-70mm f/2L', 28, 70, 2], ['Canon', 'RF 24-240mm f/4-6.3 IS', 24, 240, 4], ['Canon', 'RF 35mm f/1.8 Macro IS', 35, 35, 1.8], ['Canon', 'RF 50mm f/1.2L', 50, 50, 1.2],
    ['Canon', 'RF 50mm f/1.8 STM', 50, 50, 1.8], ['Canon', 'RF 85mm f/1.2L', 85, 85, 1.2], ['Canon', 'RF 85mm f/2 Macro IS', 85, 85, 2], ['Canon', 'RF 100mm f/2.8L Macro', 100, 100, 2.8],
    ['Canon', 'RF 135mm f/1.8L IS', 135, 135, 1.8], ['Canon', 'RF 16mm f/2.8 STM', 16, 16, 2.8], ['Canon', 'RF 100-500mm f/4.5-7.1L', 100, 500, 4.5],
    ['Sigma', '35mm f/1.4 DG DN Art (RF)', 35, 35, 1.4], ['Sigma', '85mm f/1.4 DG DN Art (RF)', 85, 85, 1.4],
  ],
  'Canon EF': [
    ['Canon', 'EF 24-70mm f/2.8L II', 24, 70, 2.8], ['Canon', 'EF 70-200mm f/2.8L IS III', 70, 200, 2.8], ['Canon', 'EF 16-35mm f/4L IS', 16, 35, 4], ['Canon', 'EF 24-105mm f/4L IS II', 24, 105, 4],
    ['Canon', 'EF 35mm f/1.4L II', 35, 35, 1.4], ['Canon', 'EF 50mm f/1.2L', 50, 50, 1.2], ['Canon', 'EF 50mm f/1.4', 50, 50, 1.4], ['Canon', 'EF 50mm f/1.8 STM', 50, 50, 1.8],
    ['Canon', 'EF 85mm f/1.2L II', 85, 85, 1.2], ['Canon', 'EF 85mm f/1.8', 85, 85, 1.8], ['Canon', 'EF 100mm f/2.8L Macro IS', 100, 100, 2.8], ['Canon', 'EF 135mm f/2L', 135, 135, 2],
    ['Canon', 'EF-S 18-135mm f/3.5-5.6 IS', 18, 135, 3.5], ['Canon', 'EF-S 17-55mm f/2.8 IS', 17, 55, 2.8],
    ['Sigma', '35mm f/1.4 DG HSM Art (EF)', 35, 35, 1.4], ['Sigma', '50mm f/1.4 DG HSM Art (EF)', 50, 50, 1.4], ['Sigma', '85mm f/1.4 DG HSM Art (EF)', 85, 85, 1.4], ['Tamron', 'SP 24-70mm f/2.8 Di VC G2 (EF)', 24, 70, 2.8],
  ],
  'Nikon Z': [
    ['Nikon', 'Z 14-24mm f/2.8 S', 14, 24, 2.8], ['Nikon', 'Z 24-70mm f/2.8 S', 24, 70, 2.8], ['Nikon', 'Z 24-70mm f/4 S', 24, 70, 4], ['Nikon', 'Z 24-120mm f/4 S', 24, 120, 4],
    ['Nikon', 'Z 70-200mm f/2.8 VR S', 70, 200, 2.8], ['Nikon', 'Z 26mm f/2.8', 26, 26, 2.8], ['Nikon', 'Z 35mm f/1.8 S', 35, 35, 1.8], ['Nikon', 'Z 40mm f/2', 40, 40, 2],
    ['Nikon', 'Z 50mm f/1.2 S', 50, 50, 1.2], ['Nikon', 'Z 50mm f/1.8 S', 50, 50, 1.8], ['Nikon', 'Z 85mm f/1.2 S', 85, 85, 1.2], ['Nikon', 'Z 85mm f/1.8 S', 85, 85, 1.8],
    ['Nikon', 'Z 105mm f/2.8 VR S Macro', 105, 105, 2.8], ['Nikon', 'Z DX 16-50mm f/3.5-6.3 VR', 16, 50, 3.5], ['Nikon', 'Z DX 50-250mm f/4.5-6.3 VR', 50, 250, 4.5],
    ['Tamron', '28-75mm f/2.8 Di III VXD G2 (Z)', 28, 75, 2.8], ['Sigma', '35mm f/1.4 DG DN Art (Z)', 35, 35, 1.4],
  ],
  'Nikon F': [
    ['Nikon', 'AF-S 24-70mm f/2.8E ED VR', 24, 70, 2.8], ['Nikon', 'AF-S 70-200mm f/2.8E FL ED VR', 70, 200, 2.8], ['Nikon', 'AF-S 14-24mm f/2.8G ED', 14, 24, 2.8],
    ['Nikon', 'AF-S 35mm f/1.8G ED', 35, 35, 1.8], ['Nikon', 'AF-S 50mm f/1.4G', 50, 50, 1.4], ['Nikon', 'AF-S 50mm f/1.8G', 50, 50, 1.8], ['Nikon', 'AF-S 85mm f/1.4G', 85, 85, 1.4],
    ['Nikon', 'AF-S 85mm f/1.8G', 85, 85, 1.8], ['Nikon', 'AF-S 105mm f/1.4E ED', 105, 105, 1.4], ['Nikon', 'AF-S DX 18-140mm f/3.5-5.6G ED VR', 18, 140, 3.5], ['Nikon', 'AF-S DX 35mm f/1.8G', 35, 35, 1.8],
    ['Sigma', '35mm f/1.4 DG HSM Art (F)', 35, 35, 1.4], ['Sigma', '85mm f/1.4 DG HSM Art (F)', 85, 85, 1.4], ['Tamron', 'SP 70-200mm f/2.8 Di VC G2 (F)', 70, 200, 2.8],
  ],
  'Sony E': [
    ['Sony', 'FE 12-24mm f/2.8 GM', 12, 24, 2.8], ['Sony', 'FE 16-35mm f/2.8 GM II', 16, 35, 2.8], ['Sony', 'FE 24-70mm f/2.8 GM II', 24, 70, 2.8], ['Sony', 'FE 24-105mm f/4 G OSS', 24, 105, 4],
    ['Sony', 'FE 70-200mm f/2.8 GM OSS II', 70, 200, 2.8], ['Sony', 'FE 28-70mm f/3.5-5.6 OSS', 28, 70, 3.5], ['Sony', 'FE 24mm f/1.4 GM', 24, 24, 1.4], ['Sony', 'FE 35mm f/1.4 GM', 35, 35, 1.4],
    ['Sony', 'FE 35mm f/1.8', 35, 35, 1.8], ['Sony', 'FE 50mm f/1.2 GM', 50, 50, 1.2], ['Sony', 'FE 50mm f/1.4 GM', 50, 50, 1.4], ['Sony', 'FE 50mm f/1.8', 50, 50, 1.8],
    ['Sony', 'FE 85mm f/1.4 GM', 85, 85, 1.4], ['Sony', 'FE 85mm f/1.8', 85, 85, 1.8], ['Sony', 'FE 90mm f/2.8 Macro G OSS', 90, 90, 2.8], ['Sony', 'FE 135mm f/1.8 GM', 135, 135, 1.8],
    ['Sony', 'E 16-55mm f/2.8 G', 16, 55, 2.8], ['Sony', 'E 18-135mm f/3.5-5.6 OSS', 18, 135, 3.5], ['Sony', 'E 35mm f/1.8 OSS', 35, 35, 1.8],
    ['Sigma', '35mm f/1.4 DG DN Art (E)', 35, 35, 1.4], ['Sigma', '50mm f/1.4 DG DN Art (E)', 50, 50, 1.4], ['Sigma', '85mm f/1.4 DG DN Art (E)', 85, 85, 1.4], ['Sigma', '24-70mm f/2.8 DG DN Art (E)', 24, 70, 2.8],
    ['Sigma', '16mm f/1.4 DC DN (E)', 16, 16, 1.4], ['Tamron', '28-75mm f/2.8 Di III VXD G2 (E)', 28, 75, 2.8], ['Tamron', '70-180mm f/2.8 Di III VXD (E)', 70, 180, 2.8], ['Tamron', '35-150mm f/2-2.8 Di III VXD (E)', 35, 150, 2],
    ['Viltrox', 'AF 85mm f/1.8 II (E)', 85, 85, 1.8], ['Viltrox', 'AF 50mm f/1.8 (E)', 50, 50, 1.8],
  ],
  'Fujifilm X': [
    ['Fujifilm', 'XF 8-16mm f/2.8 R LM WR', 8, 16, 2.8], ['Fujifilm', 'XF 16-55mm f/2.8 R LM WR', 16, 55, 2.8], ['Fujifilm', 'XF 18-55mm f/2.8-4 R LM OIS', 18, 55, 2.8], ['Fujifilm', 'XF 50-140mm f/2.8 R LM OIS WR', 50, 140, 2.8],
    ['Fujifilm', 'XF 16mm f/1.4 R WR', 16, 16, 1.4], ['Fujifilm', 'XF 23mm f/1.4 R LM WR', 23, 23, 1.4], ['Fujifilm', 'XF 23mm f/2 R WR', 23, 23, 2], ['Fujifilm', 'XF 33mm f/1.4 R LM WR', 33, 33, 1.4],
    ['Fujifilm', 'XF 35mm f/1.4 R', 35, 35, 1.4], ['Fujifilm', 'XF 35mm f/2 R WR', 35, 35, 2], ['Fujifilm', 'XF 50mm f/1.0 R WR', 50, 50, 1], ['Fujifilm', 'XF 56mm f/1.2 R', 56, 56, 1.2],
    ['Fujifilm', 'XF 90mm f/2 R LM WR', 90, 90, 2], ['Fujifilm', 'XF 18-120mm f/4 LM PZ WR', 18, 120, 4],
    ['Viltrox', 'AF 56mm f/1.4 (X)', 56, 56, 1.4], ['Sigma', '56mm f/1.4 DC DN (X)', 56, 56, 1.4], ['Sigma', '30mm f/1.4 DC DN (X)', 30, 30, 1.4], ['TTArtisan', '35mm f/1.4 (X)', 35, 35, 1.4],
  ],
  'Fujifilm GFX': [
    ['Fujifilm', 'GF 32-64mm f/4 R LM WR', 32, 64, 4], ['Fujifilm', 'GF 45mm f/2.8 R WR', 45, 45, 2.8], ['Fujifilm', 'GF 63mm f/2.8 R WR', 63, 63, 2.8], ['Fujifilm', 'GF 80mm f/1.7 R WR', 80, 80, 1.7],
    ['Fujifilm', 'GF 110mm f/2 R LM WR', 110, 110, 2], ['Fujifilm', 'GF 100-200mm f/5.6 R LM OIS WR', 100, 200, 5.6],
  ],
  'L-mount': [
    ['Panasonic', 'S 20-60mm f/3.5-5.6', 20, 60, 3.5], ['Panasonic', 'S 24-70mm f/2.8', 24, 70, 2.8], ['Panasonic', 'S Pro 24-70mm f/2.8', 24, 70, 2.8], ['Panasonic', 'S Pro 70-200mm f/2.8 OIS', 70, 200, 2.8],
    ['Panasonic', 'S 24-105mm f/4 Macro OIS', 24, 105, 4], ['Panasonic', 'S 50mm f/1.8', 50, 50, 1.8], ['Panasonic', 'S Pro 50mm f/1.4', 50, 50, 1.4], ['Panasonic', 'S 85mm f/1.8', 85, 85, 1.8], ['Panasonic', 'S 35mm f/1.8', 35, 35, 1.8],
    ['Sigma', '35mm f/1.4 DG DN Art (L)', 35, 35, 1.4], ['Sigma', '85mm f/1.4 DG DN Art (L)', 85, 85, 1.4], ['Sigma', '24-70mm f/2.8 DG DN Art (L)', 24, 70, 2.8], ['Sigma', '50mm f/1.4 DG DN Art (L)', 50, 50, 1.4],
    ['Leica', 'Vario-Elmarit-SL 24-70mm f/2.8', 24, 70, 2.8], ['Leica', 'APO-Summicron-SL 50mm f/2', 50, 50, 2],
  ],
  'Micro 4/3': [
    ['Panasonic', 'Leica DG 12-60mm f/2.8-4', 12, 60, 2.8], ['Panasonic', 'Lumix G 12-35mm f/2.8 II', 12, 35, 2.8], ['Panasonic', 'Leica DG Nocticron 42.5mm f/1.2', 42.5, 42.5, 1.2], ['Panasonic', 'Lumix G 25mm f/1.7', 25, 25, 1.7],
    ['Panasonic', 'Lumix G 20mm f/1.7 II', 20, 20, 1.7], ['Olympus', 'M.Zuiko 12-40mm f/2.8 PRO', 12, 40, 2.8], ['Olympus', 'M.Zuiko 45mm f/1.2 PRO', 45, 45, 1.2], ['Olympus', 'M.Zuiko 25mm f/1.2 PRO', 25, 25, 1.2],
    ['Olympus', 'M.Zuiko 17mm f/1.8', 17, 17, 1.8], ['Olympus', 'M.Zuiko 75mm f/1.8', 75, 75, 1.8], ['Olympus', 'M.Zuiko 40-150mm f/2.8 PRO', 40, 150, 2.8], ['Sigma', '56mm f/1.4 DC DN (MFT)', 56, 56, 1.4], ['Sigma', '30mm f/1.4 DC DN (MFT)', 30, 30, 1.4],
  ],
  'Pentax K': [
    ['Pentax', 'HD FA 31mm f/1.8 Limited', 31, 31, 1.8], ['Pentax', 'HD FA 43mm f/1.9 Limited', 43, 43, 1.9], ['Pentax', 'HD FA 77mm f/1.8 Limited', 77, 77, 1.8], ['Pentax', 'HD D FA 24-70mm f/2.8', 24, 70, 2.8],
    ['Pentax', 'HD D FA 70-200mm f/2.8', 70, 200, 2.8], ['Pentax', 'HD DA 16-85mm f/3.5-5.6', 16, 85, 3.5], ['Pentax', 'HD DA 55-300mm f/4-5.8', 55, 300, 4],
  ],
  'Hasselblad X': [
    ['Hasselblad', 'XCD 45mm f/4 P', 45, 45, 4], ['Hasselblad', 'XCD 55mm f/2.5 V', 55, 55, 2.5], ['Hasselblad', 'XCD 80mm f/1.9', 80, 80, 1.9], ['Hasselblad', 'XCD 90mm f/2.5 V', 90, 90, 2.5], ['Hasselblad', 'XCD 38mm f/2.5 V', 38, 38, 2.5],
  ],
  'Leica M': [
    ['Leica', 'Summilux-M 35mm f/1.4 ASPH', 35, 35, 1.4], ['Leica', 'Summicron-M 35mm f/2 ASPH', 35, 35, 2], ['Leica', 'Summilux-M 50mm f/1.4 ASPH', 50, 50, 1.4], ['Leica', 'APO-Summicron-M 50mm f/2 ASPH', 50, 50, 2],
    ['Leica', 'Summicron-M 28mm f/2 ASPH', 28, 28, 2], ['Leica', 'APO-Summicron-M 75mm f/2 ASPH', 75, 75, 2], ['Leica', 'APO-Summicron-M 90mm f/2 ASPH', 90, 90, 2],
  ],
};

export const lensList = (mount) => (LENSES[mount] || []).map(([brand, model, wide, tele, ap]) => ({
  name: model.startsWith(brand) ? model : `${brand} ${model}`, brand, mount, wide, tele, ap, zoom: wide !== tele,
}));
export const allLenses = () => Object.keys(LENSES).flatMap(lensList);
export const lensBrands = (list) => [...new Set(list.map((l) => l.brand))];
export const findCamera = (name) => {
  if (!name) return null;
  const n = name.toLowerCase();
  for (const [brand, models] of CAMERA_BRANDS) {
    for (const [model, mount, sensor] of models) {
      const full = `${brand.split(' ')[0]} ${model}`.toLowerCase();
      if (n === full || n === model.toLowerCase() || n === `${brand} ${model}`.toLowerCase()) return { brand, model, mount, sensor, name: `${brand.split(' ')[0]} ${model}` };
    }
  }
  return null;
};
export const cameraFullName = (brand, model) => `${brand.split(' ')[0]} ${model}`;
export const focalLabel = (l) => (l.zoom ? `${l.wide}–${l.tele}mm` : `${l.wide}mm`);
